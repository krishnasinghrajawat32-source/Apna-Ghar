import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BedLockService } from '../locks/bed-lock.service';
import { CreateBookingDto, CancelBookingDto } from './bookings.dto';
import { BookingStatus, BedStatus, Prisma, UserRole } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bedLockService: BedLockService,
  ) {}

  /**
   * Step 1: Student creates booking request (REQUESTED)
   */
  async createBookingRequest(userId: string, dto: CreateBookingDto) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required to create booking');
    }

    const bed = await this.prisma.bed.findUnique({
      where: { id: dto.bedId },
      include: {
        room: {
          include: {
            roomType: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!bed) {
      throw new NotFoundException('Bed not found');
    }

    if (bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.RESERVED || bed.status === BedStatus.INACTIVE) {
      throw new ConflictException('BED_UNAVAILABLE: Bed is currently not available for booking');
    }

    // Check if bed is temporarily held by someone else and hold hasn't expired
    if (bed.status === BedStatus.TEMPORARILY_HELD && bed.holdExpiresAt && bed.holdExpiresAt > new Date()) {
      throw new ConflictException('BED_HELD: Bed is currently held by another student');
    }

    const monthlyRent = bed.room.roomType.baseRent;
    const securityDeposit = bed.room.roomType.property.securityDeposit;
    const platformFee = new Prisma.Decimal(299);
    const bookingAmount = new Prisma.Decimal(monthlyRent).add(new Prisma.Decimal(securityDeposit)).add(platformFee);

    const bookingCode = `AG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const booking = await this.prisma.booking.create({
      data: {
        bookingCode,
        student: { connect: { id: student.id } },
        bed: { connect: { id: bed.id } },
        status: BookingStatus.REQUESTED,
        monthlyRent,
        securityDeposit,
        platformFee,
        bookingAmount,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        statusHistory: {
          create: {
            fromStatus: BookingStatus.REQUESTED,
            toStatus: BookingStatus.REQUESTED,
            actorId: userId,
            reason: 'Booking requested by student',
          },
        },
      },
      include: {
        bed: {
          include: {
            room: {
              include: {
                roomType: {
                  include: {
                    property: {
                      select: { id: true, name: true, slug: true, address: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return booking;
  }

  /**
   * Step 2: Owner approves booking request (OWNER_APPROVED)
   */
  async approveBooking(userId: string, bookingId: string) {
    const owner = await this.prisma.ownerProfile.findUnique({
      where: { userId },
    });
    if (!owner) {
      throw new BadRequestException('Owner profile required');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bed: {
          include: {
            room: {
              include: {
                roomType: {
                  include: { property: true },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.bed.room.roomType.property.ownerId !== owner.id) {
      throw new ForbiddenException('Not authorized to approve bookings for this property');
    }

    if (booking.status !== BookingStatus.REQUESTED) {
      throw new BadRequestException(`Cannot approve booking in ${booking.status} status`);
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.OWNER_APPROVED,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: BookingStatus.REQUESTED,
          toStatus: BookingStatus.OWNER_APPROVED,
          actorId: userId,
          reason: 'Owner approved booking request',
        },
      });

      return updated;
    });
  }

  /**
   * Step 3: Atomic 15-Minute Bed Hold Acquisition (PAYMENT_PENDING)
   * Protected by Redis Mutex + PostgreSQL `SELECT ... FOR UPDATE` Row Lock
   */
  async acquireBedHold(userId: string, bookingId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.studentId !== student.id) {
      throw new ForbiddenException('You can only hold beds for your own bookings');
    }
    if (booking.status !== BookingStatus.REQUESTED && booking.status !== BookingStatus.OWNER_APPROVED) {
      throw new BadRequestException(`Cannot acquire hold for booking in status ${booking.status}`);
    }

    const bedId = booking.bedId;

    // 1. Serialization Layer: Acquire Redis transient mutex
    const mutexAcquired = await this.bedLockService.acquireMutex(bedId, 3000);
    if (!mutexAcquired) {
      throw new ConflictException('CONCURRENCY_LOCK: Bed is currently undergoing concurrent checkout. Please retry.');
    }

    try {
      // 2. Authoritative ACID Layer: PostgreSQL row lock
      const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const updatedBooking = await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<Array<{ id: string; status: BedStatus; holdExpiresAt: Date | null }>>`
          SELECT id, status, "holdExpiresAt"
          FROM beds
          WHERE id = ${bedId}::uuid
          FOR UPDATE
        `;

        if (!rows || rows.length === 0) {
          throw new NotFoundException('Target bed not found');
        }

        const bedRow = rows[0];
        const now = new Date();

        const isExpired = bedRow.holdExpiresAt && new Date(bedRow.holdExpiresAt) < now;
        const isAvailable =
          bedRow.status === BedStatus.AVAILABLE ||
          (bedRow.status === BedStatus.TEMPORARILY_HELD && isExpired);

        if (!isAvailable) {
          throw new ConflictException('BED_UNAVAILABLE: Bed is currently reserved, occupied, or held by another student');
        }

        // Lock bed in PostgreSQL
        await tx.bed.update({
          where: { id: bedId },
          data: {
            status: BedStatus.TEMPORARILY_HELD,
            holdExpiresAt,
            currentBookingId: booking.id,
            version: { increment: 1 },
          },
        });

        // Transition booking to PAYMENT_PENDING
        const res = await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.PAYMENT_PENDING,
          },
        });

        // Audit state transition
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            fromStatus: booking.status,
            toStatus: BookingStatus.PAYMENT_PENDING,
            actorId: userId,
            reason: '15-minute bed hold acquired for payment processing',
          },
        });

        return res;
      });

      // 3. Set Redis 15-minute hold TTL key
      await this.bedLockService.setBedHold(bedId, student.id, 900);

      return {
        booking: updatedBooking,
        bedId,
        holdExpiresAt: holdExpiresAt.toISOString(),
        expiresInSeconds: 900,
      };
    } finally {
      // Always release transient mutex
      await this.bedLockService.releaseMutex(bedId);
    }
  }

  /**
   * Step 4: Confirm Booking after payment verified (CONFIRMED)
   */
  async confirmBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { student: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PAYMENT_PENDING && booking.status !== BookingStatus.OWNER_APPROVED) {
      throw new BadRequestException(`Cannot confirm booking in status ${booking.status}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update bed to RESERVED
      await tx.bed.update({
        where: { id: booking.bedId },
        data: {
          status: BedStatus.RESERVED,
          holdExpiresAt: null,
          currentBookingId: booking.id,
        },
      });

      // Update booking to CONFIRMED
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
        },
      });

      // Record history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: BookingStatus.CONFIRMED,
          actorId: userId,
          reason: 'Booking confirmed and bed reserved',
        },
      });

      return updated;
    });

    // Clear Redis hold key
    await this.bedLockService.releaseBedHold(booking.bedId);

    return result;
  }

  /**
   * Step 5: Student check-in (CHECKED_IN)
   */
  async checkIn(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(`Only CONFIRMED bookings can be checked in. Current status: ${booking.status}`);
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.bed.update({
        where: { id: booking.bedId },
        data: {
          status: BedStatus.OCCUPIED,
        },
      });

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CHECKED_IN,
          actualCheckIn: new Date(),
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: BookingStatus.CONFIRMED,
          toStatus: BookingStatus.CHECKED_IN,
          actorId: userId,
          reason: 'Student checked in to bed',
        },
      });

      return updated;
    });
  }

  /**
   * Step 6: Stay Completed (COMPLETED)
   */
  async completeBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException(`Only CHECKED_IN bookings can be completed. Current status: ${booking.status}`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // Bed becomes AVAILABLE again
      await tx.bed.update({
        where: { id: booking.bedId },
        data: {
          status: BedStatus.AVAILABLE,
          currentBookingId: null,
          holdExpiresAt: null,
        },
      });

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.COMPLETED,
          actualCheckOut: new Date(),
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: BookingStatus.CHECKED_IN,
          toStatus: BookingStatus.COMPLETED,
          actorId: userId,
          reason: 'Stay completed and bed released to available inventory',
        },
      });

      return updated;
    });
  }

  /**
   * Step 7: Cancel Booking (CANCELLED)
   */
  async cancelBooking(userId: string, userRole: UserRole, bookingId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        bed: {
          include: {
            room: {
              include: {
                roomType: {
                  include: { property: true },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Permission check
    if (userRole === UserRole.STUDENT && booking.student.userId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this booking');
    }

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(`Cannot cancel booking in ${booking.status} status`);
    }

    const previousStatus = booking.status;

    const result = await this.prisma.$transaction(async (tx) => {
      // If bed was held or reserved for this booking, release it back to AVAILABLE
      if (booking.bed.currentBookingId === booking.id || booking.bed.status === BedStatus.TEMPORARILY_HELD) {
        await tx.bed.update({
          where: { id: booking.bedId },
          data: {
            status: BedStatus.AVAILABLE,
            holdExpiresAt: null,
            currentBookingId: null,
          },
        });
      }

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: previousStatus,
          toStatus: BookingStatus.CANCELLED,
          actorId: userId,
          reason: dto.reason || 'Booking cancelled',
        },
      });

      return updated;
    });

    // Release Redis hold key
    await this.bedLockService.releaseBedHold(booking.bedId);

    return result;
  }

  /**
   * Student Bookings List
   */
  async getStudentBookings(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required');
    }

    return await this.prisma.booking.findMany({
      where: { studentId: student.id },
      include: {
        bed: {
          include: {
            room: {
              include: {
                roomType: {
                  include: {
                    property: {
                      select: { id: true, name: true, slug: true, address: true },
                    },
                  },
                },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Owner Bookings List
   */
  async getOwnerBookings(userId: string) {
    const owner = await this.prisma.ownerProfile.findUnique({
      where: { userId },
    });
    if (!owner) {
      throw new BadRequestException('Owner profile required');
    }

    return await this.prisma.booking.findMany({
      where: {
        bed: {
          room: {
            roomType: {
              property: {
                ownerId: owner.id,
              },
            },
          },
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            user: {
              select: { id: true, email: true },
            },
          },
        },
        bed: {
          include: {
            room: {
              include: {
                roomType: {
                  include: {
                    property: {
                      select: { id: true, name: true, slug: true },
                    },
                  },
                },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get Single Booking Details with Audit Status History
   */
  async getBookingById(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            userId: true,
            user: { select: { id: true, email: true } },
          },
        },
        bed: {
          include: {
            room: {
              include: {
                roomType: {
                  include: {
                    property: {
                      select: { id: true, name: true, slug: true, address: true, ownerId: true },
                    },
                  },
                },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }
}
