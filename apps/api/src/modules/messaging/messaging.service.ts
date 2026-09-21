import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingEventService } from './messaging-event.service';
import { CreateConversationDto, SendMessageDto } from './messaging.dto';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventService: MessagingEventService,
  ) {}

  /**
   * Get an existing 1-on-1 conversation or create a new one.
   */
  async getOrCreateConversation(userId: string, dto: CreateConversationDto) {
    if (userId === dto.recipientUserId) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientUserId },
    });
    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    // Check if conversation already exists between these 2 users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: dto.recipientUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true, role: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (existing) {
      if (dto.initialMessage) {
        await this.sendMessage(userId, existing.id, dto.initialMessage);
      }
      return existing;
    }

    // Create new conversation
    const conversation = await this.prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          participants: {
            create: [
              { userId, lastReadAt: new Date() },
              { userId: dto.recipientUserId, lastReadAt: null },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, email: true, role: true },
              },
            },
          },
        },
      });

      if (dto.initialMessage) {
        await tx.message.create({
          data: {
            conversationId: conv.id,
            senderId: userId,
            content: dto.initialMessage,
          },
        });
      }

      return conv;
    });

    if (dto.initialMessage) {
      this.eventService.emitToUser(dto.recipientUserId, 'NEW_MESSAGE', {
        conversationId: conversation.id,
        senderId: userId,
        content: dto.initialMessage,
      });
    }

    return conversation;
  }

  /**
   * List all conversations for the user with last message preview and unread count
   */
  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true, role: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const results = [];
    for (const conv of conversations) {
      const selfParticipant = conv.participants.find((p) => p.userId === userId);
      const lastRead = selfParticipant?.lastReadAt;

      const unreadCount = await this.prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
        },
      });

      results.push({
        id: conv.id,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        participants: conv.participants,
        lastMessage: conv.messages[0] || null,
        unreadCount,
      });
    }

    return results;
  }

  /**
   * Retrieve message history for a conversation
   */
  async getConversationMessages(
    userId: string,
    conversationId: string,
    limit: number = 50,
  ) {
    // Verify participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages;
  }

  /**
   * Send a message in a conversation and notify the recipient
   */
  async sendMessage(senderUserId: string, conversationId: string, content: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: senderUserId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: senderUserId,
          content,
        },
        include: {
          sender: {
            select: { id: true, email: true, role: true },
          },
        },
      });

      // Update conversation updatedAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Update sender's lastReadAt
      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: senderUserId,
          },
        },
        data: { lastReadAt: new Date() },
      });

      return msg;
    });

    // Notify other participants in realtime
    const otherParticipants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: senderUserId },
      },
      select: { userId: true },
    });

    for (const p of otherParticipants) {
      this.eventService.emitToUser(p.userId, 'NEW_MESSAGE', {
        id: message.id,
        conversationId,
        senderId: senderUserId,
        content: message.content,
        createdAt: message.createdAt,
      });
    }

    return message;
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markAsRead(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const updated = await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    return {
      success: true,
      conversationId,
      lastReadAt: updated.lastReadAt,
    };
  }
}
