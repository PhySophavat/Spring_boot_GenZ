/**
 * useChat.ts — Custom hook encapsulating all chat state and operations.
 *
 * Manages:
 * - Conversation list + selected conversation
 * - Messages with cursor-based pagination (infinite scroll)
 * - WebSocket subscriptions
 * - Typing indicator state
 * - Online/offline user presence
 * - Send, edit, delete, reply, read operations
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchConversations,
  fetchMessages,
  createConversation,
  editMessage as apiEditMessage,
  deleteMessage as apiDeleteMessage,
  markRead,
  type ConversationData,
  type MessageData,
  type MemberInfo,
} from "../services/chatApi";
import { chatSocket, TypingEvent, UserStatusEvent } from "../services/socket";
import { getSession } from "../services/authService";

// ── Types ─────────────────────────────────────────────────────────────

interface TypingUser {
  userId: number;
  fullName: string;
}

interface OnlineStatus {
  [userId: number]: "ONLINE" | "OFFLINE";
}

interface ChatState {
  conversations: ConversationData[];
  selectedConversation: ConversationData | null;
  messages: MessageData[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  currentPage: number;
  typingUsers: TypingUser[];
  onlineStatus: OnlineStatus;
  replyToMessage: MessageData | null;
  editingMessage: MessageData | null;
  error: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useChat() {
  const [state, setState] = useState<ChatState>({
    conversations: [],
    selectedConversation: null,
    messages: [],
    isLoadingConversations: false,
    isLoadingMessages: false,
    hasMoreMessages: true,
    currentPage: 0,
    typingUsers: [],
    onlineStatus: {},
    replyToMessage: null,
    editingMessage: null,
    error: null,
  });

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectedRef = useRef(false);

  // ── WebSocket connect ──────────────────────────────────────────────

  useEffect(() => {
    const session = getSession();
    if (!session?.token) return;

    chatSocket.connect(
      session.token,
      () => {
        isConnectedRef.current = true;
        chatSocket.subscribeUserStatus(handleStatusEvent);
        chatSocket.sendStatus("ONLINE");
      },
      (err) => {
        console.error("[useChat] WebSocket error:", err);
      }
    );

    return () => {
      chatSocket.sendStatus("OFFLINE");
      chatSocket.disconnect();
      isConnectedRef.current = false;
    };
  }, []);

  // ── Load conversations ─────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    setState((s) => ({ ...s, isLoadingConversations: true, error: null }));
    try {
      const convs = await fetchConversations();
      setState((s) => ({ ...s, conversations: convs, isLoadingConversations: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoadingConversations: false,
        error: "Failed to load conversations",
      }));
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Select a conversation ─────────────────────────────────────────

  const selectConversation = useCallback(
    async (conv: ConversationData) => {
      // Unsubscribe from previous conversation
      if (state.selectedConversation) {
        chatSocket.unsubscribeConversation(state.selectedConversation.id);
      }

      setState((s) => ({
        ...s,
        selectedConversation: conv,
        messages: [],
        currentPage: 0,
        hasMoreMessages: true,
        typingUsers: [],
        replyToMessage: null,
        editingMessage: null,
      }));

      await loadMessages(conv.id, 0, true);

      // Subscribe to all conversation topics
      chatSocket.subscribeMessages(conv.id, handleNewMessage);
      chatSocket.subscribeEdits(conv.id, handleEditedMessage);
      chatSocket.subscribeDeletes(conv.id, handleDeletedMessage);
      chatSocket.subscribeTyping(conv.id, handleTypingEvent);
      chatSocket.subscribeRead(conv.id, handleReadEvent);
    },
    [state.selectedConversation]
  );

  // ── Load messages (paginated) ─────────────────────────────────────

  const loadMessages = useCallback(
    async (conversationId: number, page: number, replace: boolean) => {
      setState((s) => ({ ...s, isLoadingMessages: true }));
      try {
        const pageData = await fetchMessages(conversationId, page, 30);
        // Backend returns newest first; reverse for correct display order
        const reversed = [...pageData.content].reverse();
        setState((s) => ({
          ...s,
          messages: replace ? reversed : [...reversed, ...s.messages],
          currentPage: page,
          hasMoreMessages: !pageData.last,
          isLoadingMessages: false,
        }));
      } catch {
        setState((s) => ({
          ...s,
          isLoadingMessages: false,
          error: "Failed to load messages",
        }));
      }
    },
    []
  );

  const loadOlderMessages = useCallback(() => {
    const { selectedConversation, currentPage, hasMoreMessages, isLoadingMessages } = state;
    if (!selectedConversation || !hasMoreMessages || isLoadingMessages) return;
    loadMessages(selectedConversation.id, currentPage + 1, false);
  }, [state, loadMessages]);

  // ── Send message ─────────────────────────────────────────────────

  const sendMessage = useCallback(
    (payload: {
      content?: string;
      messageType: string;
      replyToMessageId?: number;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    }) => {
      const { selectedConversation } = state;
      if (!selectedConversation) return;

      chatSocket.sendMessage({
        conversationId: selectedConversation.id,
        ...payload,
      });

      // Clear reply/edit state after send
      setState((s) => ({ ...s, replyToMessage: null, editingMessage: null }));

      // Optimistically refresh conversation list to update "last message"
      setTimeout(() => loadConversations(), 500);
    },
    [state.selectedConversation, loadConversations]
  );

  // ── Edit / Delete ─────────────────────────────────────────────────

  const submitEdit = useCallback(async (content: string) => {
    const { editingMessage } = state;
    if (!editingMessage) return;
    await apiEditMessage(editingMessage.id, content);
    setState((s) => ({ ...s, editingMessage: null }));
  }, [state.editingMessage]);

  const submitDelete = useCallback(async (messageId: number) => {
    await apiDeleteMessage(messageId);
  }, []);

  // ── Reply / Edit setters ──────────────────────────────────────────

  const setReplyTo = (msg: MessageData | null) =>
    setState((s) => ({ ...s, replyToMessage: msg, editingMessage: null }));

  const setEditing = (msg: MessageData | null) =>
    setState((s) => ({ ...s, editingMessage: msg, replyToMessage: null }));

  // ── Mark read ─────────────────────────────────────────────────────

  const markMessageRead = useCallback(async (messageId: number) => {
    await markRead(messageId);
    chatSocket.sendRead(messageId);
  }, []);

  // ── Typing indicator ─────────────────────────────────────────────

  const sendTypingStart = useCallback(() => {
    const { selectedConversation } = state;
    if (!selectedConversation) return;
    chatSocket.sendTyping(selectedConversation.id, "TYPING_START");

    // Auto-send TYPING_STOP after 3 seconds of no input
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      chatSocket.sendTyping(selectedConversation.id, "TYPING_STOP");
    }, 3000);
  }, [state.selectedConversation]);

  // ── Start new conversation ────────────────────────────────────────

  const startConversationWith = useCallback(async (user: MemberInfo) => {
    const conv = await createConversation(user.id);
    setState((s) => ({
      ...s,
      conversations: [conv, ...s.conversations.filter((c) => c.id !== conv.id)],
    }));
    await selectConversation(conv);
  }, [selectConversation]);

  // ── WebSocket event handlers ──────────────────────────────────────

  const handleNewMessage = useCallback((msg: MessageData) => {
    setState((s) => {
      const exists = s.messages.some((m) => m.id === msg.id);
      if (exists) return s;
      return {
        ...s,
        messages: [...s.messages, msg],
        // Update unread count on conversations list
        conversations: s.conversations.map((c) =>
          c.id === msg.conversationId
            ? { ...c, lastMessage: msg, updatedAt: msg.createdAt }
            : c
        ),
      };
    });
  }, []);

  const handleEditedMessage = useCallback((msg: MessageData) => {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) => (m.id === msg.id ? msg : m)),
    }));
  }, []);

  const handleDeletedMessage = useCallback((msg: MessageData) => {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) => (m.id === msg.id ? msg : m)),
    }));
  }, []);

  const handleTypingEvent = useCallback((event: TypingEvent) => {
    setState((s) => {
      if (event.eventType === "TYPING_START") {
        const already = s.typingUsers.some((u) => u.userId === event.userId);
        if (already) return s;
        return {
          ...s,
          typingUsers: [...s.typingUsers, { userId: event.userId, fullName: event.userFullName }],
        };
      } else {
        return {
          ...s,
          typingUsers: s.typingUsers.filter((u) => u.userId !== event.userId),
        };
      }
    });
  }, []);

  const handleReadEvent = useCallback(
    (event: { messageId: number; userId: number }) => {
      setState((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === event.messageId && !m.readByUserIds.includes(event.userId)
            ? { ...m, readByUserIds: [...m.readByUserIds, event.userId] }
            : m
        ),
      }));
    },
    []
  );

  const handleStatusEvent = useCallback((event: UserStatusEvent) => {
    setState((s) => ({
      ...s,
      onlineStatus: { ...s.onlineStatus, [event.userId]: event.status },
      conversations: s.conversations.map((c) => ({
        ...c,
        members: c.members.map((m) =>
          m.id === event.userId ? { ...m, onlineStatus: event.status } : m
        ),
      })),
    }));
  }, []);

  return {
    ...state,
    loadConversations,
    selectConversation,
    loadOlderMessages,
    sendMessage,
    submitEdit,
    submitDelete,
    setReplyTo,
    setEditing,
    markMessageRead,
    sendTypingStart,
    startConversationWith,
  };
}
