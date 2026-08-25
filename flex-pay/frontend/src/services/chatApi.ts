/**
 * chatApi.ts — Axios-based REST client for all admin chat endpoints.
 *
 * Token is read from localStorage (set by authService) and attached to
 * every request via an Axios interceptor.
 */
import axios from "axios";
import { getSession } from "./authService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8082";

export const chatAxios = axios.create({ baseURL: BASE_URL });

// Attach JWT to every request
chatAxios.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

// ── Types ────────────────────────────────────────────────────────────

export interface AttachmentInfo {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface SenderInfo {
  id: number;
  fullName: string;
  profileImage?: string;
  role: string;
}

export interface MessageData {
  id: number;
  conversationId: number;
  sender: SenderInfo;
  content: string | null;
  messageType: "TEXT" | "IMAGE" | "FILE";
  replyToMessageId?: number;
  replyToMessage?: Partial<MessageData>;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: AttachmentInfo[];
  readByUserIds: number[];
}

export interface MemberInfo {
  id: number;
  fullName: string;
  profileImage?: string;
  role: string;
  onlineStatus: "ONLINE" | "OFFLINE";
  lastSeen?: string;
}

export interface ConversationData {
  id: number;
  type: "DIRECT" | "GROUP";
  members: MemberInfo[];
  lastMessage?: MessageData;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageData<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ── Conversations ─────────────────────────────────────────────────────

export async function fetchConversations(): Promise<ConversationData[]> {
  const { data } = await chatAxios.get<ApiResponse<ConversationData[]>>(
    "/api/admin/chat/conversations"
  );
  return data.data;
}

export async function fetchConversation(id: number): Promise<ConversationData> {
  const { data } = await chatAxios.get<ApiResponse<ConversationData>>(
    `/api/admin/chat/conversations/${id}`
  );
  return data.data;
}

export async function createConversation(targetUserId: number): Promise<ConversationData> {
  const { data } = await chatAxios.post<ApiResponse<ConversationData>>(
    "/api/admin/chat/conversations",
    { targetUserId }
  );
  return data.data;
}

// ── Messages ──────────────────────────────────────────────────────────

export async function fetchMessages(
  conversationId: number,
  page = 0,
  size = 30
): Promise<PageData<MessageData>> {
  const { data } = await chatAxios.get<ApiResponse<PageData<MessageData>>>(
    `/api/admin/chat/conversations/${conversationId}/messages`,
    { params: { page, size } }
  );
  return data.data;
}

export async function sendMessageRest(
  conversationId: number,
  payload: {
    content?: string;
    messageType: string;
    replyToMessageId?: number;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }
): Promise<MessageData> {
  const { data } = await chatAxios.post<ApiResponse<MessageData>>(
    `/api/admin/chat/conversations/${conversationId}/messages`,
    payload
  );
  return data.data;
}

export async function editMessage(
  messageId: number,
  content: string
): Promise<MessageData> {
  const { data } = await chatAxios.put<ApiResponse<MessageData>>(
    `/api/admin/chat/messages/${messageId}`,
    { content }
  );
  return data.data;
}

export async function deleteMessage(messageId: number): Promise<MessageData> {
  const { data } = await chatAxios.delete<ApiResponse<MessageData>>(
    `/api/admin/chat/messages/${messageId}`
  );
  return data.data;
}

export async function markRead(messageId: number): Promise<void> {
  await chatAxios.post(`/api/admin/chat/messages/${messageId}/read`);
}

// ── User Search ───────────────────────────────────────────────────────

export async function searchUsers(keyword: string): Promise<MemberInfo[]> {
  const { data } = await chatAxios.get<ApiResponse<MemberInfo[]>>(
    "/api/admin/chat/users/search",
    { params: { keyword } }
  );
  return data.data;
}

// ── File Upload ───────────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<{
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await chatAxios.post<ApiResponse<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>>("/api/admin/chat/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}
