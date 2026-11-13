import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UserRole } from '@apna-ghar/shared-types';
import { Logger } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessageEvent } from './messaging.types';

type ChatRole = UserRole.STUDENT | UserRole.OWNER;

interface SocketUser {
  userId: string;
  role: ChatRole;
}

interface AuthenticatedSocket extends Socket {
  data: { user?: SocketUser };
}

interface JwtPayload {
  sub: string;
  role: UserRole;
}

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allowed?: boolean) => void,
    ) => {
      const configuredOrigins = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const isVercelOrigin =
        !!origin && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
      const isAllowed =
        !origin ||
        origin === 'http://localhost:3000' ||
        origin === 'https://apnaghar.in' ||
        configuredOrigins.includes(origin) ||
        isVercelOrigin;
      callback(
        isAllowed ? null : new Error('Origin is not allowed'),
        isAllowed,
      );
    },
    credentials: true,
  },
})
export class MessagingGateway
  implements
    OnGatewayConnection<AuthenticatedSocket>,
    OnGatewayDisconnect<AuthenticatedSocket>
{
  private readonly logger = new Logger(MessagingGateway.name);
  private readonly activeSockets = new Map<string, Set<string>>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;
      if (typeof token !== 'string' || !token) {
        client.disconnect(true);
        return;
      }

      const secret =
        this.configService.get<string>('jwtAccessSecret') ||
        'dev_jwt_access_secret_min_32_characters_seed';
      const payload = jwt.verify(token, secret) as JwtPayload;
      if (
        typeof payload.sub !== 'string' ||
        (payload.role !== UserRole.STUDENT && payload.role !== UserRole.OWNER)
      ) {
        client.disconnect(true);
        return;
      }

      client.data.user = { userId: payload.sub, role: payload.role };
      await client.join(this.userRoom(payload.sub));
      const sockets = this.activeSockets.get(payload.sub) ?? new Set<string>();
      const wasOffline = sockets.size === 0;
      sockets.add(client.id);
      this.activeSockets.set(payload.sub, sockets);

      if (wasOffline) {
        const conversationIds =
          await this.messagingService.getConversationIdsForUser(payload.sub);
        for (const conversationId of conversationIds) {
          this.server
            .to(this.conversationRoom(conversationId))
            .emit('presence:update', {
              userId: payload.sub,
              online: true,
            });
        }
      }
    } catch (error) {
      this.logger.warn(
        `Rejected unauthenticated messaging socket ${client.id}: ${
          error instanceof Error ? error.message : 'invalid authentication'
        }`,
      );
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user) return;

    const sockets = this.activeSockets.get(user.userId);
    sockets?.delete(client.id);
    if (sockets && sockets.size > 0) return;
    this.activeSockets.delete(user.userId);

    for (const room of client.rooms) {
      if (room.startsWith('conversation:')) {
        this.server.to(room).emit('presence:update', {
          userId: user.userId,
          online: false,
        });
      }
    }
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const user = client.data.user;
    if (!user || typeof body?.conversationId !== 'string') return;

    try {
      const participant = await this.messagingService.assertParticipant(
        user.userId,
        user.role,
        body.conversationId,
      );
      const room = this.conversationRoom(participant.conversationId);
      await client.join(room);
      const pendingMessageIds =
        await this.messagingService.markPendingMessagesDelivered(
          user.userId,
          participant.conversationId,
        );
      const deliveredAt = new Date();
      for (const messageId of pendingMessageIds) {
        this.server
          .to(this.userRoom(participant.otherParticipantId))
          .emit('message:status', {
            conversationId: participant.conversationId,
            messageId,
            deliveredAt,
            readAt: null,
          });
      }
      this.server.to(room).emit('presence:update', {
        userId: user.userId,
        online: true,
      });
      client.emit('conversation:joined', {
        conversationId: participant.conversationId,
        otherParticipantOnline: this.isOnline(participant.otherParticipantId),
      });
    } catch (error) {
      client.emit('conversation:error', {
        conversationId: body.conversationId,
        message:
          error instanceof Error
            ? error.message
            : 'You cannot join this conversation.',
      });
    }
  }

  @SubscribeMessage('typing:start')
  async typingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    await this.broadcastTyping(client, body?.conversationId, true);
  }

  @SubscribeMessage('typing:stop')
  async typingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    await this.broadcastTyping(client, body?.conversationId, false);
  }

  async publishMessage(
    conversationId: string,
    message: MessageEvent,
    recipientId: string,
  ) {
    if (this.isOnline(recipientId)) {
      const recipientRole =
        message.senderRole === UserRole.STUDENT
          ? UserRole.OWNER
          : UserRole.STUDENT;
      const status = await this.messagingService.markDelivered(
        recipientId,
        recipientRole,
        conversationId,
        message.id,
      );
      message.deliveredAt = status.deliveredAt;
    }
    this.server.to(this.userRoom(recipientId)).emit('message:new', message);
    return message;
  }

  async publishReadStatus(
    conversationId: string,
    messageIds: string[],
    readerId: string,
    otherParticipantId: string,
    readAt: Date,
  ) {
    this.server.to(this.userRoom(otherParticipantId)).emit('messages:read', {
      conversationId,
      messageIds,
      readerId,
      readAt,
    });
  }

  private async broadcastTyping(
    client: AuthenticatedSocket,
    conversationId: string | undefined,
    isTyping: boolean,
  ) {
    const user = client.data.user;
    if (!user || !conversationId) return;
    try {
      const participant = await this.messagingService.assertParticipant(
        user.userId,
        user.role,
        conversationId,
      );
      client
        .to(this.conversationRoom(participant.conversationId))
        .emit('typing:update', {
          conversationId: participant.conversationId,
          userId: user.userId,
          isTyping,
        });
    } catch {
      client.emit('conversation:error', {
        conversationId,
        message: 'You cannot send typing updates to this conversation.',
      });
    }
  }

  private isOnline(userId: string) {
    return (this.activeSockets.get(userId)?.size ?? 0) > 0;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private conversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }
}
