import { UserRole } from '@apna-ghar/shared-types';

export interface MessageEvent {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole.STUDENT | UserRole.OWNER;
  text: string;
  createdAt: Date;
  deliveredAt: Date | null;
  readAt: Date | null;
}
