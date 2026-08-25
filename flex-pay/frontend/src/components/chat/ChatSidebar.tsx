/**
 * ChatSidebar.tsx — Left panel showing all conversations.
 * Features: search filter, unread badges, online status dots, user avatars.
 */
import { useState } from "react";
import type { ConversationData } from "../../services/chatApi";
import { Search, MessageSquare, Plus } from "lucide-react";

interface Props {
  conversations: ConversationData[];
  selectedId: number | null;
  isLoading: boolean;
  onSelect: (conv: ConversationData) => void;
  onNewChat: () => void;
  currentUserId?: number;
}

function getOtherMember(conv: ConversationData, currentUserId?: number) {
  return conv.members.find((m) => m.id !== currentUserId) ?? conv.members[0];
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function AvatarCircle({ name, image, online }: { name: string; image?: string; online: boolean }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative flex-shrink-0">
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
        />
      ) : (
        <div className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold ring-2 ring-white dark:ring-gray-800">
          {initials}
        </div>
      )}
      <span
        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
          online ? "bg-emerald-400" : "bg-gray-400"
        }`}
      />
    </div>
  );
}

export default function ChatSidebar({
  conversations,
  selectedId,
  isLoading,
  onSelect,
  onNewChat,
  currentUserId,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((conv) => {
    const other = getOtherMember(conv, currentUserId);
    return other?.fullName?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-violet-600" />
          <span className="text-base font-bold text-gray-900 dark:text-white">Messages</span>
        </div>
        <button
          onClick={onNewChat}
          title="Start new conversation"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-400 transition"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <MessageSquare size={32} className="opacity-30" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const other   = getOtherMember(conv, currentUserId);
            const isOnline = other?.onlineStatus === "ONLINE";
            const isActive = conv.id === selectedId;
            const lastMsg  = conv.lastMessage;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-2 ${
                  isActive
                    ? "bg-violet-50 dark:bg-violet-900/30 border-violet-600"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <AvatarCircle
                  name={other?.fullName ?? "User"}
                  image={other?.profileImage}
                  online={isOnline}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className={`text-sm font-semibold truncate ${isActive ? "text-violet-700 dark:text-violet-300" : "text-gray-900 dark:text-white"}`}>
                      {other?.fullName ?? "Unknown User"}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatTime(conv.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {lastMsg?.isDeleted
                        ? "🗑 This message was deleted"
                        : lastMsg?.messageType === "IMAGE"
                        ? "📷 Image"
                        : lastMsg?.messageType === "FILE"
                        ? "📎 File"
                        : lastMsg?.content ?? "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-violet-600 text-white text-[10px] font-bold">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
