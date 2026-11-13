'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Inbox,
  MessageCircle,
  MessageSquareText,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { UserRole } from '@apna-ghar/shared-types';
import { apiClient, getSocketUrl } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';

interface ConversationSummary {
  id: string;
  property: { id: string; name: string; slug: string } | null;
  student?: { name: string; college: string };
  lastMessage: { text: string; createdAt: string; senderRole: UserRole } | null;
  unreadCount: number;
  updatedAt: string;
}

export function ConversationList({
  role,
}: {
  role: UserRole.STUDENT | UserRole.OWNER;
}) {
  const isOwner = role === UserRole.OWNER;
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const [notificationPermission, setNotificationPermission] =
    useState('default');
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const query = useQuery<ConversationSummary[]>({
    queryKey: [isOwner ? 'owner-inbox' : 'chat-conversations'],
    queryFn: () =>
      apiClient<ConversationSummary[]>(
        isOwner ? '/messages/owner/inbox' : '/messages/conversations',
      ),
  });

  useEffect(() => {
    setNotificationsSupported('Notification' in window);
    if ('Notification' in window)
      setNotificationPermission(Notification.permission);
  }, []);

  useEffect(() => {
    const token =
      accessToken ||
      (typeof window !== 'undefined'
        ? window.localStorage.getItem('apna_ghar_access_token')
        : null);
    if (!token || !user) return;

    const socket = io(getSocketUrl(), {
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    const onMessage = (message: { text: string }) => {
      queryClient.invalidateQueries({
        queryKey: [isOwner ? 'owner-inbox' : 'chat-conversations'],
      });
      if (
        document.hidden &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('New Apna Ghar message', { body: message.text });
      }
    };
    socket.on('message:new', onMessage);
    return () => {
      socket.disconnect();
    };
  }, [accessToken, isOwner, queryClient, user]);

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    setNotificationPermission(await Notification.requestPermission());
  };

  return (
    <main className="mx-auto min-h-[65vh] max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#F5A623]">
            {isOwner ? (
              <Inbox className="h-5 w-5" />
            ) : (
              <MessageCircle className="h-5 w-5" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">
              Apna Ghar messages
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-[#102B50] sm:text-3xl">
            {isOwner ? 'Owner inbox' : 'Your conversations'}
          </h1>
          <p className="mt-1 text-sm text-[#687586]">
            {isOwner
              ? 'Reply to students enquiring about your properties.'
              : 'Chat directly with owners about the properties you are interested in.'}
          </p>
        </div>
        {notificationsSupported && notificationPermission === 'default' && (
          <button
            type="button"
            onClick={requestNotifications}
            className="shrink-0 rounded-lg border border-[#E8E5DE] px-3 py-2 text-[11px] font-bold text-[#102B50] hover:bg-[#FAF8F3]"
          >
            Enable notifications
          </button>
        )}
      </header>

      {query.isLoading ? (
        <div className="rounded-2xl border border-[#E8E5DE] bg-white p-8 text-center text-sm text-[#687586]">
          Loading conversations…
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
          <p className="text-sm font-bold text-red-700">
            Could not load messages.
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 rounded-lg bg-[#102B50] px-4 py-2 text-xs font-bold text-white"
          >
            Try again
          </button>
        </div>
      ) : query.data?.length ? (
        <div className="space-y-3">
          {query.data.map((conversation) => {
            const title = isOwner
              ? conversation.student?.name || 'Student inquiry'
              : conversation.property?.name || 'Property conversation';
            return (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-[#E8E5DE] bg-white p-4 shadow-sm transition hover:border-[#F5A623] hover:shadow-md sm:p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#102B50] text-[#F5A623]">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h2 className="truncate text-sm font-black text-[#102B50]">
                      {title}
                    </h2>
                    <time
                      className="shrink-0 text-[10px] text-[#687586]"
                      dateTime={
                        conversation.lastMessage?.createdAt ||
                        String(conversation.updatedAt)
                      }
                    >
                      {new Date(
                        conversation.lastMessage?.createdAt ||
                          conversation.updatedAt,
                      ).toLocaleDateString()}
                    </time>
                  </div>
                  <p className="mt-0.5 truncate text-xs font-medium text-[#687586]">
                    {isOwner && conversation.property?.name
                      ? `${conversation.property.name} · `
                      : ''}
                    {conversation.lastMessage?.text ||
                      (isOwner
                        ? 'No messages yet'
                        : 'Start a conversation with the owner')}
                  </p>
                  {isOwner && conversation.student?.college && (
                    <p className="mt-1 truncate text-[10px] text-[#687586]">
                      {conversation.student.college} · shared by student
                    </p>
                  )}
                </div>
                {conversation.unreadCount > 0 && (
                  <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#F5A623] px-1.5 text-[10px] font-black text-[#102B50]">
                    {conversation.unreadCount}
                  </span>
                )}
                <ArrowRight className="h-4 w-4 shrink-0 text-[#687586] transition group-hover:translate-x-1 group-hover:text-[#102B50]" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#D9D4C8] bg-white px-6 py-14 text-center">
          <MessageCircle className="mx-auto h-9 w-9 text-[#F5A623]" />
          <h2 className="mt-4 text-base font-black text-[#102B50]">
            {isOwner ? 'Your inbox is empty' : 'No conversations yet'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#687586]">
            {isOwner
              ? 'Student enquiries about your listed properties will appear here.'
              : 'Open a property listing and choose “Chat with Owner” to ask a question.'}
          </p>
          {!isOwner && (
            <Link
              href="/search"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-4 py-2.5 text-xs font-bold text-[#102B50] hover:bg-[#E99A12]"
            >
              Explore properties <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
