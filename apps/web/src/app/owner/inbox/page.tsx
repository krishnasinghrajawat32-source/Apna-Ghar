'use client';

import React from 'react';
import { UserRole } from '@apna-ghar/shared-types';
import { AuthGuard } from '@/features/auth/auth-guard';
import { ConversationList } from '@/components/messaging/conversation-list';

export default function OwnerInboxPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.OWNER]}>
      <ConversationList role={UserRole.OWNER} />
    </AuthGuard>
  );
}
