'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { UserRole } from '@apna-ghar/shared-types';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { ChatThread } from '@/components/messaging/chat-thread';

function ConversationPageContent() {
  const params = useParams<{ conversationId: string }>();
  const user = useAuthStore((state) => state.user);
  if (!user || (user.role !== UserRole.STUDENT && user.role !== UserRole.OWNER))
    return null;

  return <ChatThread conversationId={params.conversationId} role={user.role} />;
}

export default function ConversationPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.STUDENT, UserRole.OWNER]}>
      <ConversationPageContent />
    </AuthGuard>
  );
}
