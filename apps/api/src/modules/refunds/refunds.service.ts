import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import {
  CancellationReason,
  RefundStatus,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
  ) {}

  /**
   * Previews refund eligibility based on days before check-in and policy tiers
   */
  async calculateCancellationRefund(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        bed: {
          include: {
            room: {
              include: {
                roomType: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const now = new Date();
    const moveIn = new Date(booking.startDate);
    const diffMs = moveIn.getTime() - now.getTime();
    const daysBeforeCheckIn = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Query active cancellation policies
    const policies = await this.prisma.cancellationPolicy.findMany({
      where: {
        OR: [
          { propertyId: booking.bed.room.roomType.propertyId },
          { propertyId: null },
        ],
        isActive: true,
      },
      orderBy: { daysBeforeCheckIn: 'desc' },
    });

    let refundPercentage = 0;

    if (policies.length > 0) {
      for (const policy of policies) {
        if (daysBeforeCheckIn >= policy.daysBeforeCheckIn) {
          refundPercentage = Number(policy.refundPercentage);
          break;
        }
      }
    } else {
      // Default platform policy
      if (daysBeforeCheckIn >= 15) {
        refundPercentage = 100;
      } else if (daysBeforeCheckIn >= 7) {
        refundPercentage = 50;
      } else {
        refundPercentage = 0;
      }
    }

    const bookingAmount = Number(booking.bookingAmount);
    const eligibleRefundAmount = Math.round((bookingAmount * refundPercentage) / 100);
    const cancellationFee = bookingAmount - eligibleRefundAmount;

    return {
      bookingId,
      bookingAmount,
      startDate: booking.startDate.toISOString(),
      daysBeforeCheckIn,
      refundPercentage,
      eligibleRefundAmount,
      cancellationFee,
    };
  }

  /**
   * Cancels booking and executes automated refund record creation
   */
  async cancelAndProcessRefund(
    userId: string,
    userRole: UserRole,
    bookingId: string,
    reason?: string,
  ) {
    const calc = await this.calculateCancellationRefund(bookingId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, student: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (userRole === UserRole.STUDENT && booking.student.userId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this booking');
    }

    // Cancel booking and release inventory
    await this.bookingsService.cancelBooking(userId, userRole, bookingId, {
      reason: reason || 'Student requested cancellation with refund',
    });

    let refundRecord: any = null;

    // Process refund if payment was made
    if (booking.payment && booking.payment.status === PaymentStatus.SUCCESS && calc.eligibleRefundAmount > 0) {
      refundRecord = await this.prisma.refund.create({
        data: {
          booking: { connect: { id: booking.id } },
          payment: { connect: { id: booking.payment.id } },
          amount: new Prisma.Decimal(calc.eligibleRefundAmount),
          reason: CancellationReason.STUDENT_CANCELLATION,
          notes: reason || 'Policy-driven automated refund',
          status: RefundStatus.APPROVED,
          providerRefundId: `rfnd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          processedAt: new Date(),
        },
      });

      const isFullRefund = calc.eligibleRefundAmount >= calc.bookingAmount;
      await this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });
    }

    return {
      cancelled: true,
      calculation: calc,
      refund: refundRecord,
    };
  }
}
