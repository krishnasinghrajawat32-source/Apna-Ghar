'use client';

import React from 'react';
import { UserRole } from '@apna-ghar/shared-types';
import { AuthGuard } from '@/features/auth/auth-guard';
import { ConversationList } from '@/components/messaging/conversation-list';

export default function StudentMessagesPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.STUDENT]}>
      <ConversationList role={UserRole.STUDENT} />
    </AuthGuard>
  );
}
