import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationDocument,
  Message,
  MessageDocument,
} from '@apna-ghar/database';
import { UserRole } from '@apna-ghar/shared-types';
import { Model, Types } from 'mongoose';
import {
  Property,
  PropertyDocument,
} from '../properties/schemas/property.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { ShareStudentDetailsDto } from './dto/share-student-details.dto';

type ChatRole = UserRole.STUDENT | UserRole.OWNER;

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  async startConversation(studentId: string, propertyId: string) {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException('Invalid property ID.');
    }

    const property = await this.propertyModel
      .findOne({ _id: new Types.ObjectId(propertyId), status: 'ACTIVE' })
      .select('_id ownerId name slug')
      .exec();
    if (!property) {
      throw new NotFoundException(
        'This property is not available for enquiries.',
      );
    }
    if (property.ownerId.toString() === studentId) {
      throw new ForbiddenException(
        'You cannot start a conversation with your own property.',
      );
    }

    const filter = {
      studentId: new Types.ObjectId(studentId),
      propertyId: property._id,
    };
    try {
      await this.conversationModel.updateOne(
        filter,
        {
          $setOnInsert: {
            ownerId: property.ownerId,
            participants: [
              { userId: new Types.ObjectId(studentId), role: UserRole.STUDENT },
              { userId: property.ownerId, role: UserRole.OWNER },
            ],
          },
        },
        { upsert: true },
      );
    } catch (error) {
      if (!(
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      )) {
        throw error;
      }
    }

    const conversation = await this.conversationModel.findOne(filter).exec();
    if (!conversation) {
      throw new NotFoundException('Unable to open the conversation.');
    }
    return this.getConversation(studentId, UserRole.STUDENT, conversation.id);
  }

  async listConversations(userId: string, role: ChatRole) {
    const field = role === UserRole.STUDENT ? 'studentId' : 'ownerId';
    const conversations = await this.conversationModel
      .find({ [field]: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .limit(100)
      .exec();

    return Promise.all(
      conversations.map(async (conversation) => {
        const [property, latestMessage] = await Promise.all([
          this.propertyModel
            .findById(conversation.propertyId)
            .select('name slug')
            .lean()
            .exec(),
          this.messageModel
            .findOne({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .exec(),
        ]);
        const participant = conversation.participants.find(
          (item) => item.userId.toString() === userId,
        );
        const shared =
          role === UserRole.OWNER
            ? conversation.sharedStudentDetails
            : undefined;

        return {
          id: conversation.id,
          property: property
            ? {
                id: property._id.toString(),
                name: property.name,
                slug: property.slug,
              }
            : null,
          student:
            role === UserRole.OWNER
              ? {
                  name: shared?.name || 'Student',
                  college: shared?.college || '',
                }
              : undefined,
          lastMessage: latestMessage
            ? this.serializeMessage(latestMessage)
            : null,
          unreadCount: participant?.unreadCount ?? 0,
          updatedAt: conversation.updatedAt,
        };
      }),
    );
  }

  async getConversation(
    userId: string,
    role: ChatRole,
    conversationId: string,
  ) {
    const conversation = await this.getAuthorizedConversation(
      userId,
      role,
      conversationId,
    );
    const property = await this.propertyModel
      .findById(conversation.propertyId)
      .select('name slug')
      .lean()
      .exec();

    return {
      id: conversation.id,
      property: property
        ? {
            id: property._id.toString(),
            name: property.name,
            slug: property.slug,
          }
        : null,
      participantRole: role,
      sharedStudentDetails: conversation.sharedStudentDetails,
      unreadCount:
        conversation.participants.find(
          (item) => item.userId.toString() === userId,
        )?.unreadCount ?? 0,
    };
  }

  async getMessages(userId: string, role: ChatRole, conversationId: string) {
    const conversation = await this.getAuthorizedConversation(
      userId,
      role,
      conversationId,
    );
    const messages = await this.messageModel
      .find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
    return messages.reverse().map((message) => this.serializeMessage(message));
  }

  async sendMessage(
    userId: string,
    role: ChatRole,
    conversationId: string,
    dto: SendMessageDto,
  ) {
    const conversation = await this.getAuthorizedConversation(
      userId,
      role,
      conversationId,
    );
    const text = dto.text.trim();
    if (!text) {
      throw new BadRequestException('Message cannot be empty.');
    }

    const recipientId =
      role === UserRole.STUDENT ? conversation.ownerId : conversation.studentId;
    const message = await this.messageModel.create({
      conversationId: conversation._id,
      senderId: new Types.ObjectId(userId),
      senderRole: role,
      text,
    });

    await this.conversationModel.updateOne(
      { _id: conversation._id },
      {
        $inc: { 'participants.$[recipient].unreadCount': 1 },
        $set: { updatedAt: message.createdAt },
      },
      { arrayFilters: [{ 'recipient.userId': recipientId }] },
    );

    return {
      message: this.serializeMessage(message),
      recipientId: recipientId.toString(),
    };
  }

  async markRead(userId: string, role: ChatRole, conversationId: string) {
    const conversation = await this.getAuthorizedConversation(
      userId,
      role,
      conversationId,
    );
    const now = new Date();
    const unreadMessages = await this.messageModel
      .find({
        conversationId: conversation._id,
        senderId: { $ne: new Types.ObjectId(userId) },
        readAt: null,
      })
      .select('_id')
      .exec();
    await Promise.all([
      this.messageModel.updateMany(
        {
          conversationId: conversation._id,
          senderId: { $ne: new Types.ObjectId(userId) },
          readAt: null,
        },
        { $set: { deliveredAt: now, readAt: now } },
      ),
      this.conversationModel.updateOne(
        { _id: conversation._id },
        {
          $set: {
            'participants.$[reader].unreadCount': 0,
            'participants.$[reader].lastReadAt': now,
          },
        },
        { arrayFilters: [{ 'reader.userId': new Types.ObjectId(userId) }] },
      ),
    ]);
    return {
      conversationId,
      readAt: now,
      messageIds: unreadMessages.map((message) => message._id.toString()),
    };
  }

  async shareStudentDetails(
    studentId: string,
    conversationId: string,
    dto: ShareStudentDetailsDto,
  ) {
    const conversation = await this.getAuthorizedConversation(
      studentId,
      UserRole.STUDENT,
      conversationId,
    );
    const sharedAt = new Date();
    const details = {
      name: dto.name?.trim() || '',
      college: dto.college?.trim() || '',
      preferredMoveInDate: dto.preferredMoveInDate
        ? new Date(dto.preferredMoveInDate)
        : null,
      monthlyBudget: dto.monthlyBudget ?? null,
      notes: dto.notes?.trim() || '',
      sharedAt,
    };

    await this.conversationModel.updateOne(
      { _id: conversation._id, studentId: new Types.ObjectId(studentId) },
      { $set: { sharedStudentDetails: details } },
    );
    return details;
  }

  async revokeSharedDetails(studentId: string, conversationId: string) {
    const conversation = await this.getAuthorizedConversation(
      studentId,
      UserRole.STUDENT,
      conversationId,
    );
    await this.conversationModel.updateOne(
      { _id: conversation._id, studentId: new Types.ObjectId(studentId) },
      {
        $set: {
          sharedStudentDetails: {
            name: '',
            college: '',
            preferredMoveInDate: null,
            monthlyBudget: null,
            notes: '',
            sharedAt: null,
          },
        },
      },
    );
    return { revoked: true };
  }

  async assertParticipant(
    userId: string,
    role: ChatRole,
    conversationId: string,
  ) {
    const conversation = await this.getAuthorizedConversation(
      userId,
      role,
      conversationId,
    );
    return {
      conversationId: conversation.id,
      otherParticipantId:
        role === UserRole.STUDENT
          ? conversation.ownerId.toString()
          : conversation.studentId.toString(),
    };
  }

  async markDelivered(
    userId: string,
    role: ChatRole,
    conversationId: string,
    messageId: string,
  ) {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message ID.');
    }
    const conversation = await this.getAuthorizedConversation(
      userId,
      role,
      conversationId,
    );
    const now = new Date();
    await this.messageModel.updateOne(
      {
        _id: new Types.ObjectId(messageId),
        conversationId: conversation._id,
        senderId: { $ne: new Types.ObjectId(userId) },
        deliveredAt: null,
      },
      { $set: { deliveredAt: now } },
    );
    return { conversationId, messageId, deliveredAt: now };
  }

  async markPendingMessagesDelivered(userId: string, conversationId: string) {
    const { conversationId: authorizedId } = await this.assertParticipant(
      userId,
      await this.getParticipantRole(userId, conversationId),
      conversationId,
    );
    const now = new Date();
    const pending = await this.messageModel
      .find({
        conversationId: new Types.ObjectId(authorizedId),
        senderId: { $ne: new Types.ObjectId(userId) },
        deliveredAt: null,
      })
      .select('_id')
      .exec();
    if (pending.length) {
      await this.messageModel.updateMany(
        { _id: { $in: pending.map((message) => message._id) } },
        { $set: { deliveredAt: now } },
      );
    }
    return pending.map((message) => message._id.toString());
  }

  async getConversationIdsForUser(userId: string) {
    const conversations = await this.conversationModel
      .find({
        $or: [
          { studentId: new Types.ObjectId(userId) },
          { ownerId: new Types.ObjectId(userId) },
        ],
      })
      .select('_id')
      .exec();
    return conversations.map((conversation) => conversation.id);
  }

  private async getParticipantRole(
    userId: string,
    conversationId: string,
  ): Promise<ChatRole> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation ID.');
    }
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }
    const participant = conversation.participants.find(
      (item) => item.userId.toString() === userId,
    );
    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation.',
      );
    }
    return participant.role;
  }

  private async getAuthorizedConversation(
    userId: string,
    role: ChatRole,
    conversationId: string,
  ): Promise<ConversationDocument> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation ID.');
    }
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }
    const isParticipant = conversation.participants.some(
      (participant) =>
        participant.userId.toString() === userId && participant.role === role,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You do not have access to this conversation.',
      );
    }
    return conversation;
  }

  private serializeMessage(message: MessageDocument) {
    return {
      id: message.id,
      conversationId: message.conversationId.toString(),
      senderId: message.senderId.toString(),
      senderRole: message.senderRole,
      text: message.text,
      createdAt: message.createdAt,
      deliveredAt: message.deliveredAt ?? null,
      readAt: message.readAt ?? null,
    };
  }
}
