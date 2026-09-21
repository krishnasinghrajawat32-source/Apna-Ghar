import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDisputeDto, AddEvidenceDto, ResolveDisputeDto } from './disputes.dto';
import {
  DisputeStatus,
  BookingStatus,
  CancellationReason,
  RefundStatus,
  UserRole,
  Prisma,
} from '@prisma/client';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Student or Owner files a formal dispute
   */
  async raiseDispute(userId: string, role: UserRole, dto: CreateDisputeDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
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

    const studentId = booking.studentId;
    const ownerId = booking.bed.room.roomType.property.ownerId;

    if (role === UserRole.STUDENT && booking.student.userId !== userId) {
      throw new ForbiddenException('You can only file disputes for your own bookings');
    }

    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          booking: { connect: { id: booking.id } },
          student: { connect: { id: studentId } },
          owner: { connect: { id: ownerId } },
          raisedByRole: role,
          reason: dto.reason,
          description: dto.description,
          status: DisputeStatus.OPEN,
        },
      });

      // Update booking status to DISPUTED
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.DISPUTED },
      });

      return created;
    });

    return dispute;
  }

  /**
   * Uploads and attaches documentation/photos to an open dispute
   */
  async addEvidence(userId: string, disputeId: string, dto: AddEvidenceDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Cannot attach evidence to a closed dispute');
    }

    return await this.prisma.disputeEvidence.create({
      data: {
        dispute: { connect: { id: dispute.id } },
        uploadedBy: userId,
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
        description: dto.description,
      },
    });
  }

  /**
   * Role-filtered list of disputes
   */
  async getDisputes(userId: string, role: UserRole) {
    let whereClause: any = {};

    if (role === UserRole.STUDENT) {
      const student = await this.prisma.studentProfile.findUnique({ where: { userId } });
      if (!student) throw new BadRequestException('Student profile not found');
      whereClause = { studentId: student.id };
    } else if (role === UserRole.OWNER) {
      const owner = await this.prisma.ownerProfile.findUnique({ where: { userId } });
      if (!owner) throw new BadRequestException('Owner profile not found');
      whereClause = { ownerId: owner.id };
    } // ADMIN sees all

    return await this.prisma.dispute.findMany({
      where: whereClause,
      include: {
        evidence: true,
        booking: {
          select: {
            id: true,
            bookingCode: true,
            bookingAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin Arbitration Resolution
   */
  async resolveDispute(adminUserId: string, disputeId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: { payment: true },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      let refundAmountDecimal: Prisma.Decimal | null = null;

      if (dto.refundAmount && dto.refundAmount > 0) {
        refundAmountDecimal = new Prisma.Decimal(dto.refundAmount);

        // Create refund record if booking had successful payment
        if (dispute.booking.payment) {
          await tx.refund.create({
            data: {
              booking: { connect: { id: dispute.booking.id } },
              payment: { connect: { id: dispute.booking.payment.id } },
              amount: refundAmountDecimal,
              reason: CancellationReason.VALID_DISPUTE,
              notes: `Dispute arbitration award: ${dto.adminDecision}`,
              status: RefundStatus.APPROVED,
              providerRefundId: `rfnd_disp_${Date.now()}`,
              processedByAdminId: adminUserId,
              processedAt: new Date(),
            },
          });
        }
      }

      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: dto.status,
          adminDecision: dto.adminDecision,
          refundAmount: refundAmountDecimal,
          closedAt: new Date(),
        },
        include: { evidence: true },
      });

      return updated;
    });
  }
}
