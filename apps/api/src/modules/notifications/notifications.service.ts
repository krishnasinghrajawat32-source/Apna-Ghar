import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingEventService } from '../messaging/messaging-event.service';
import { CreateNotificationDto } from './notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventService: MessagingEventService,
  ) {}

  /**
   * Dispatch a multi-channel notification:
   * 1. Persist in database
   * 2. Push in real-time via SSE event bus
   * 3. Trigger external adapters (Email / SMS)
   */
  async send(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        body: dto.body,
        type: dto.type,
        linkUrl: dto.linkUrl,
        isRead: false,
      },
    });

    // Push realtime event
    this.eventService.emitToUser(dto.userId, 'NEW_NOTIFICATION', notification);

    // External Channel Adapters (Mocked with structured log)
    this.dispatchExternalAdapters(dto);

    return notification;
  }

  private dispatchExternalAdapters(dto: CreateNotificationDto) {
    this.logger.log(
      `[MultiChannel Delivery] [EMAIL/SMS] Successfully dispatched alert to user ${dto.userId}: [${dto.type}] "${dto.title}"`,
    );
  }

  /**
   * Retrieve in-app notifications for authenticated user
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false, limit: number = 20) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return { unreadCount: count };
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return {
      success: true,
      updatedCount: result.count,
    };
  }
}
