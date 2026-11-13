import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException } from '@nestjs/common';
import { Conversation, Message } from '@apna-ghar/database';
import { UserRole } from '@apna-ghar/shared-types';
import { Types } from 'mongoose';
import { Property } from '../properties/schemas/property.schema';
import { MessagingService } from './messaging.service';

describe('MessagingService', () => {
  let service: MessagingService;
  const studentId = new Types.ObjectId();
  const ownerId = new Types.ObjectId();
  const conversationId = new Types.ObjectId();
  const propertyId = new Types.ObjectId();

  const conversation = {
    _id: conversationId,
    id: conversationId.toString(),
    studentId,
    ownerId,
    propertyId,
    participants: [
      { userId: studentId, role: UserRole.STUDENT, unreadCount: 0 },
      { userId: ownerId, role: UserRole.OWNER, unreadCount: 0 },
    ],
  };

  const conversationModel = {
    findById: jest.fn(),
    updateOne: jest.fn(),
  };
  const messageModel = {
    create: jest.fn(),
  };
  const propertyModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: getModelToken(Conversation.name),
          useValue: conversationModel,
        },
        { provide: getModelToken(Message.name), useValue: messageModel },
        { provide: getModelToken(Property.name), useValue: propertyModel },
      ],
    }).compile();
    service = module.get<MessagingService>(MessagingService);
    jest.clearAllMocks();
  });

  it('rejects access from a user who is not a conversation participant', async () => {
    conversationModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(conversation),
    });

    await expect(
      service.getMessages(
        new Types.ObjectId().toString(),
        UserRole.STUDENT,
        conversationId.toString(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('persists trimmed messages and increments only the recipient unread count', async () => {
    const now = new Date();
    conversationModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(conversation),
    });
    conversationModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
    messageModel.create.mockResolvedValue({
      id: new Types.ObjectId().toString(),
      conversationId,
      senderId: studentId,
      senderRole: UserRole.STUDENT,
      text: 'Is a room available?',
      createdAt: now,
      deliveredAt: null,
      readAt: null,
    });

    const result = await service.sendMessage(
      studentId.toString(),
      UserRole.STUDENT,
      conversationId.toString(),
      { text: '  Is a room available?  ' },
    );

    expect(messageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId,
        senderId: studentId,
        senderRole: UserRole.STUDENT,
        text: 'Is a room available?',
      }),
    );
    expect(conversationModel.updateOne).toHaveBeenCalledWith(
      { _id: conversationId },
      expect.objectContaining({
        $inc: { 'participants.$[recipient].unreadCount': 1 },
      }),
      { arrayFilters: [{ 'recipient.userId': ownerId }] },
    );
    expect(result.recipientId).toBe(ownerId.toString());
    expect(result.message.text).toBe('Is a room available?');
  });
});
