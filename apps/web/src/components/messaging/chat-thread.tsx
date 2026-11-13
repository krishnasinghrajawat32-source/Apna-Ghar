'use client';

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { UserRole } from '@apna-ghar/shared-types';
import { apiClient, getSocketUrl } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';

type ChatRole = UserRole.STUDENT | UserRole.OWNER;

interface SharedStudentDetails {
  name: string;
  college: string;
  preferredMoveInDate: string | null;
  monthlyBudget: number | null;
  notes: string;
  sharedAt: string | null;
}

interface ChatConversation {
  id: string;
  property: { id: string; name: string; slug: string } | null;
  participantRole: ChatRole;
  sharedStudentDetails: SharedStudentDetails;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: ChatRole;
  text: string;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export function ChatThread({
  conversationId,
  role,
}: {
  conversationId: string;
  role: ChatRole;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [notificationPermission, setNotificationPermission] =
    useState('default');

  const conversationQuery = useQuery<ChatConversation>({
    queryKey: ['chat-conversation', conversationId],
    queryFn: () =>
      apiClient<ChatConversation>(`/messages/conversations/${conversationId}`),
    enabled: !!user,
  });
  const messagesQuery = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', conversationId],
    queryFn: () =>
      apiClient<ChatMessage[]>(
        `/messages/conversations/${conversationId}/messages`,
      ),
    enabled: !!user,
  });

  const conversation = conversationQuery.data;
  const messages = messagesQuery.data ?? [];
  const detailValues = conversation?.sharedStudentDetails;

  useEffect(() => {
    if (!detailValues) return;
    setName(detailValues.name || '');
    setCollege(detailValues.college || '');
    setMoveInDate(detailValues.preferredMoveInDate?.slice(0, 10) || '');
    setBudget(detailValues.monthlyBudget?.toString() || '');
    setNotes(detailValues.notes || '');
  }, [detailValues]);

  useEffect(() => {
    setNotificationsSupported('Notification' in window);
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
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
    socketRef.current = socket;

    const joinConversation = () => {
      setConnected(true);
      socket.emit('conversation:join', { conversationId });
    };

    const receiveMessage = (message: ChatMessage) => {
      if (
        document.hidden &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('New Apna Ghar message', { body: message.text });
      }
      if (message.conversationId !== conversationId) {
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
        queryClient.invalidateQueries({ queryKey: ['owner-inbox'] });
        return;
      }

      queryClient.setQueryData<ChatMessage[]>(
        ['chat-messages', conversationId],
        (current = []) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
      );
      queryClient.invalidateQueries({
        queryKey: ['chat-conversation', conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['owner-inbox'] });
    };

    const updateMessageStatus = (status: {
      messageId: string;
      deliveredAt: string | null;
      readAt: string | null;
    }) => {
      queryClient.setQueryData<ChatMessage[]>(
        ['chat-messages', conversationId],
        (current = []) =>
          current.map((message) =>
            message.id === status.messageId
              ? {
                  ...message,
                  deliveredAt: status.deliveredAt,
                  readAt: status.readAt,
                }
              : message,
          ),
      );
    };

    socket.on('connect', joinConversation);
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => {
      setConnected(false);
      setError('Reconnecting to live chat. You can still send messages.');
    });
    socket.on(
      'conversation:joined',
      (data: { otherParticipantOnline: boolean }) => {
        setOtherOnline(data.otherParticipantOnline);
        setError('');
      },
    );
    socket.on('conversation:error', (data: { message?: string }) => {
      setError(data.message || 'Unable to join this conversation.');
    });
    socket.on(
      'presence:update',
      (data: { userId: string; online: boolean }) => {
        if (data.userId !== user.id) setOtherOnline(data.online);
      },
    );
    socket.on(
      'typing:update',
      (data: { userId: string; isTyping: boolean }) => {
        if (data.userId === user.id) return;
        setOtherTyping(data.isTyping);
        if (otherTypingTimer.current) clearTimeout(otherTypingTimer.current);
        if (data.isTyping) {
          otherTypingTimer.current = setTimeout(
            () => setOtherTyping(false),
            2500,
          );
        }
      },
    );
    socket.on('message:new', receiveMessage);
    socket.on('message:status', updateMessageStatus);
    socket.on(
      'messages:read',
      (event: { messageIds: string[]; readAt: string }) => {
        event.messageIds.forEach((messageId) =>
          updateMessageStatus({
            messageId,
            deliveredAt: event.readAt,
            readAt: event.readAt,
          }),
        );
      },
    );

    socket.connect();
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (otherTypingTimer.current) clearTimeout(otherTypingTimer.current);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [accessToken, conversationId, queryClient, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages.length]);

  useEffect(() => {
    const hasUnreadIncoming = messages.some(
      (message) => message.senderId !== user?.id && !message.readAt,
    );
    if (!hasUnreadIncoming || !user) return;

    apiClient<{ readAt: string }>(
      `/messages/conversations/${conversationId}/read`,
      {
        method: 'PATCH',
      },
    )
      .then(({ readAt }) => {
        queryClient.setQueryData<ChatMessage[]>(
          ['chat-messages', conversationId],
          (current = []) =>
            current.map((message) =>
              message.senderId !== user.id && !message.readAt
                ? { ...message, deliveredAt: readAt, readAt }
                : message,
            ),
        );
        queryClient.invalidateQueries({
          queryKey: ['chat-conversation', conversationId],
        });
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
        queryClient.invalidateQueries({ queryKey: ['owner-inbox'] });
      })
      .catch(() => setError('Could not update read receipts. Reconnecting…'));
  }, [conversationId, messages, queryClient, user]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setError('');
    setIsSending(true);
    try {
      const message = await apiClient<ChatMessage>(
        `/messages/conversations/${conversationId}/messages`,
        { method: 'POST', body: JSON.stringify({ text }) },
      );
      queryClient.setQueryData<ChatMessage[]>(
        ['chat-messages', conversationId],
        (current = []) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
      );
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['owner-inbox'] });
      setDraft('');
      socketRef.current?.emit('typing:stop', { conversationId });
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Message could not be sent.',
      );
    } finally {
      setIsSending(false);
    }
  };

  const shareDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      await apiClient(
        `/messages/conversations/${conversationId}/shared-details`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            college,
            preferredMoveInDate: moveInDate || undefined,
            monthlyBudget: budget ? Number(budget) : undefined,
            notes,
          }),
        },
      );
      await queryClient.invalidateQueries({
        queryKey: ['chat-conversation', conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['owner-inbox'] });
    } catch (shareError) {
      setError(
        shareError instanceof Error
          ? shareError.message
          : 'Details could not be shared.',
      );
    }
  };

  const revokeDetails = async () => {
    setError('');
    try {
      await apiClient(
        `/messages/conversations/${conversationId}/shared-details`,
        {
          method: 'DELETE',
        },
      );
      await queryClient.invalidateQueries({
        queryKey: ['chat-conversation', conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['owner-inbox'] });
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : 'Details could not be removed.',
      );
    }
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  if (conversationQuery.isLoading || messagesQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-[#687586]">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        Loading conversation…
      </div>
    );
  }

  if (conversationQuery.isError || messagesQuery.isError || !conversation) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <p className="font-bold text-[#102B50]">Conversation unavailable</p>
        <p className="mt-2 text-sm text-[#687586]">
          This conversation may have been removed, or your account may not have
          access.
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 rounded-xl bg-[#102B50] px-4 py-2 text-sm font-bold text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  const isOwner = role === UserRole.OWNER;
  const shared = conversation.sharedStudentDetails;

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row">
      <div className="flex min-h-[70vh] min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[#E8E5DE] bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-[#E8E5DE] px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={isOwner ? '/owner/inbox' : '/student/messages'}
              aria-label="Back to messages"
              className="rounded-lg p-2 text-[#687586] hover:bg-[#FAF8F3]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#102B50] text-[#F5A623]">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black text-[#102B50]">
                {isOwner ? shared.name || 'Student inquiry' : 'Property owner'}
              </h1>
              <p className="truncate text-xs text-[#687586]">
                {conversation.property?.name || 'Property conversation'}
                <span className="mx-1.5">·</span>
                <span
                  className={connected && otherOnline ? 'text-[#21865B]' : ''}
                >
                  {connected
                    ? otherOnline
                      ? 'Online'
                      : 'Offline'
                    : 'Reconnecting…'}
                </span>
              </p>
            </div>
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

        {!connected && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
            Live connection is offline. Messages will still send and appear when
            you reconnect.
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#FAF8F3] p-4 sm:p-6"
        >
          {messages.length === 0 && (
            <div className="m-auto max-w-sm text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-[#F5A623]" />
              <p className="mt-3 text-sm font-bold text-[#102B50]">
                Start the conversation
              </p>
              <p className="mt-1 text-xs text-[#687586]">
                Ask about availability, rent, amenities, or arrange a visit.
              </p>
            </div>
          )}
          {messages.map((message) => {
            const isMine = message.senderId === user?.id;
            return (
              <article
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${
                  isMine
                    ? 'ml-auto rounded-br-md bg-[#102B50] text-white'
                    : 'mr-auto rounded-bl-md border border-[#E8E5DE] bg-white text-[#263445]'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">
                  {message.text}
                </p>
                <div
                  className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                    isMine ? 'text-white/70' : 'text-[#687586]'
                  }`}
                >
                  <time dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </time>
                  {isMine && (
                    <span
                      title={
                        message.readAt
                          ? 'Read'
                          : message.deliveredAt
                            ? 'Delivered'
                            : 'Sent'
                      }
                      aria-label={
                        message.readAt
                          ? 'Read'
                          : message.deliveredAt
                            ? 'Delivered'
                            : 'Sent'
                      }
                    >
                      {message.readAt || message.deliveredAt ? (
                        <CheckCheck className="h-3.5 w-3.5" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
          {otherTyping && (
            <p className="mr-auto rounded-full bg-white px-3 py-2 text-xs text-[#687586]">
              {isOwner ? 'Student' : 'Owner'} is typing…
            </p>
          )}
        </div>

        <form
          onSubmit={sendMessage}
          className="flex items-end gap-2 border-t border-[#E8E5DE] p-3 sm:p-4"
        >
          <textarea
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              socketRef.current?.emit('typing:start', { conversationId });
              if (typingTimer.current) clearTimeout(typingTimer.current);
              typingTimer.current = setTimeout(
                () =>
                  socketRef.current?.emit('typing:stop', { conversationId }),
                1000,
              );
            }}
            onBlur={() =>
              socketRef.current?.emit('typing:stop', { conversationId })
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={2000}
            rows={2}
            placeholder="Write a message…"
            aria-label="Message"
            className="min-h-11 flex-1 resize-none rounded-2xl border border-[#E8E5DE] bg-white px-4 py-3 text-sm text-[#263445] outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5A623] text-[#102B50] transition hover:bg-[#E99A12] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <aside className="h-fit w-full rounded-3xl border border-[#E8E5DE] bg-white p-5 shadow-sm lg:w-80">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#21865B]" />
          <div>
            <h2 className="text-sm font-black text-[#102B50]">
              Property enquiry
            </h2>
            <p className="mt-1 text-xs text-[#687586]">
              {conversation.property?.name || 'Apna Ghar listing'}
            </p>
          </div>
        </div>
        {isOwner ? (
          <div className="mt-5 border-t border-[#E8E5DE] pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#687586]">
              Details shared by student
            </h3>
            {shared.sharedAt ? (
              <dl className="mt-3 space-y-3 text-xs">
                {shared.name && <Detail label="Name" value={shared.name} />}
                {shared.college && (
                  <Detail label="College" value={shared.college} />
                )}
                {shared.preferredMoveInDate && (
                  <Detail
                    label="Move-in date"
                    value={new Date(
                      shared.preferredMoveInDate,
                    ).toLocaleDateString()}
                  />
                )}
                {shared.monthlyBudget !== null && (
                  <Detail
                    label="Monthly budget"
                    value={`₹${shared.monthlyBudget.toLocaleString('en-IN')}`}
                  />
                )}
                {shared.notes && <Detail label="Notes" value={shared.notes} />}
                <p className="text-[10px] text-[#687586]">
                  Shared voluntarily on{' '}
                  {new Date(shared.sharedAt).toLocaleDateString()}.
                </p>
              </dl>
            ) : (
              <p className="mt-2 text-xs text-[#687586]">
                The student has not shared additional personal details.
              </p>
            )}
          </div>
        ) : (
          <details
            className="mt-5 border-t border-[#E8E5DE] pt-4"
            open={!!shared.sharedAt}
          >
            <summary className="cursor-pointer text-xs font-bold text-[#102B50]">
              Voluntarily share your details
            </summary>
            <p className="mt-2 text-[11px] leading-relaxed text-[#687586]">
              Nothing below is shared unless you press “Share details”. You can
              remove it later.
            </p>
            <form onSubmit={shareDetails} className="mt-3 space-y-2.5">
              <Field label="Name">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  className="mt-1 w-full rounded-lg border border-[#E8E5DE] px-3 py-2 text-xs outline-none focus:border-[#F5A623]"
                />
              </Field>
              <Field label="College">
                <input
                  value={college}
                  onChange={(event) => setCollege(event.target.value)}
                  maxLength={150}
                  className="mt-1 w-full rounded-lg border border-[#E8E5DE] px-3 py-2 text-xs outline-none focus:border-[#F5A623]"
                />
              </Field>
              <Field label="Preferred move-in">
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(event) => setMoveInDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E8E5DE] px-3 py-2 text-xs outline-none focus:border-[#F5A623]"
                />
              </Field>
              <Field label="Monthly budget (₹)">
                <input
                  type="number"
                  min={0}
                  max={10000000}
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E8E5DE] px-3 py-2 text-xs outline-none focus:border-[#F5A623]"
                />
              </Field>
              <Field label="Other relevant details">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="mt-1 w-full resize-y rounded-lg border border-[#E8E5DE] px-3 py-2 text-xs outline-none focus:border-[#F5A623]"
                />
              </Field>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#102B50] px-3 py-2 text-xs font-bold text-white hover:bg-[#183D68]"
              >
                {shared.sharedAt ? 'Update shared details' : 'Share details'}
              </button>
              {shared.sharedAt && (
                <button
                  type="button"
                  onClick={revokeDetails}
                  className="w-full rounded-xl border border-[#E8E5DE] px-3 py-2 text-xs font-semibold text-[#687586] hover:bg-[#FAF8F3]"
                >
                  Remove shared details
                </button>
              )}
            </form>
          </details>
        )}
      </aside>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[11px] font-semibold text-[#263445]">
      {label}
      {children}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#687586]">
        {label}
      </dt>
      <dd className="mt-0.5 break-words font-medium text-[#263445]">{value}</dd>
    </div>
  );
}
