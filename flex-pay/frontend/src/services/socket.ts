/**
 * socket.ts — STOMP over SockJS client singleton.
 *
 * Manages the WebSocket connection lifecycle: connect, subscribe, send, disconnect.
 * Reconnects automatically using @stomp/stompjs built-in reconnect delay.
 *
 * Usage:
 *   chatSocket.connect(token);
 *   chatSocket.subscribeConversation(id, handler);
 *   chatSocket.sendMessage(payload);
 *   chatSocket.disconnect();
 */
import { Client, IMessage, IFrame } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { MessageData } from "./chatApi";

const WS_URL = import.meta.env.VITE_WS_BASE_URL ?? "http://localhost:8082";

export type MessageHandler  = (msg: MessageData) => void;
export type TypingHandler   = (event: TypingEvent) => void;
export type StatusHandler   = (event: UserStatusEvent) => void;
export type ReadHandler     = (event: ReadEvent) => void;

export interface TypingEvent {
  conversationId: number;
  userId: number;
  userFullName: string;
  eventType: "TYPING_START" | "TYPING_STOP";
}

export interface UserStatusEvent {
  userId: number;
  status: "ONLINE" | "OFFLINE";
  lastSeen: string;
}

export interface ReadEvent {
  messageId: number;
  userId: number;
  readAt: string;
}

class ChatSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, ReturnType<Client["subscribe"]>> = new Map();

  /** Connects to the STOMP endpoint, setting the JWT as a connect header. */
  connect(token: string, onConnected?: () => void, onError?: (err: IFrame | string) => void) {
    if (this.client?.connected) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        console.debug("[ChatSocket] Connected");
        onConnected?.();
      },
      onStompError: (frame) => {
        console.error("[ChatSocket] STOMP error", frame);
        onError?.(frame);
      },
      onDisconnect: () => {
        console.debug("[ChatSocket] Disconnected");
      },
    });

    this.client.activate();
  }

  disconnect() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.client?.deactivate();
    this.client = null;
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  // ── Subscriptions ──────────────────────────────────────────────────

  /** Subscribe to new messages for a conversation */
  subscribeMessages(conversationId: number, handler: MessageHandler) {
    const topic = `/topic/conversation.${conversationId}.messages`;
    this._subscribe(topic, (msg) => handler(JSON.parse(msg.body)));
  }

  /** Subscribe to edited messages */
  subscribeEdits(conversationId: number, handler: MessageHandler) {
    const topic = `/topic/conversation.${conversationId}.messages.edited`;
    this._subscribe(topic, (msg) => handler(JSON.parse(msg.body)));
  }

  /** Subscribe to deleted messages */
  subscribeDeletes(conversationId: number, handler: MessageHandler) {
    const topic = `/topic/conversation.${conversationId}.messages.deleted`;
    this._subscribe(topic, (msg) => handler(JSON.parse(msg.body)));
  }

  /** Subscribe to typing events */
  subscribeTyping(conversationId: number, handler: TypingHandler) {
    const topic = `/topic/conversation.${conversationId}.typing`;
    this._subscribe(topic, (msg) => handler(JSON.parse(msg.body)));
  }

  /** Subscribe to read receipts */
  subscribeRead(conversationId: number, handler: ReadHandler) {
    const topic = `/topic/conversation.${conversationId}.read`;
    this._subscribe(topic, (msg) => handler(JSON.parse(msg.body)));
  }

  /** Subscribe to global user online/offline status */
  subscribeUserStatus(handler: StatusHandler) {
    this._subscribe("/topic/users.status", (msg) => handler(JSON.parse(msg.body)));
  }

  /** Unsubscribe all subscriptions for a conversation */
  unsubscribeConversation(conversationId: number) {
    const prefixes = [
      `/topic/conversation.${conversationId}.messages`,
      `/topic/conversation.${conversationId}.messages.edited`,
      `/topic/conversation.${conversationId}.messages.deleted`,
      `/topic/conversation.${conversationId}.typing`,
      `/topic/conversation.${conversationId}.read`,
    ];
    prefixes.forEach((p) => {
      this.subscriptions.get(p)?.unsubscribe();
      this.subscriptions.delete(p);
    });
  }

  // ── Publish ────────────────────────────────────────────────────────

  /** Send a message via WebSocket */
  sendMessage(payload: {
    conversationId: number;
    content?: string;
    messageType: string;
    replyToMessageId?: number;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }) {
    this._publish("/app/chat.sendMessage", payload);
  }

  /** Send typing start/stop event */
  sendTyping(conversationId: number, eventType: "TYPING_START" | "TYPING_STOP") {
    this._publish("/app/chat.typing", { conversationId, eventType });
  }

  /** Send read receipt */
  sendRead(messageId: number) {
    this._publish("/app/chat.readMessage", { messageId });
  }

  /** Send status update */
  sendStatus(status: "ONLINE" | "OFFLINE") {
    this._publish("/app/chat.status", { status });
  }

  // ── Private helpers ────────────────────────────────────────────────

  private _subscribe(topic: string, handler: (msg: IMessage) => void) {
    if (!this.client?.connected) {
      console.warn("[ChatSocket] Not connected; subscription deferred for:", topic);
      return;
    }
    if (this.subscriptions.has(topic)) return; // already subscribed
    const sub = this.client.subscribe(topic, handler);
    this.subscriptions.set(topic, sub);
  }

  private _publish(destination: string, body: unknown) {
    if (!this.client?.connected) {
      console.warn("[ChatSocket] Not connected; message dropped:", destination);
      return;
    }
    this.client.publish({ destination, body: JSON.stringify(body) });
  }
}

/** Singleton — one WebSocket connection for the whole app */
export const chatSocket = new ChatSocketService();
