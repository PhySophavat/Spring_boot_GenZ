/**
 * ChatHeader.tsx — Top bar for the active conversation.
 * Shows user name, online status, and a message search toggle.
 */
import { useState } from "react";
import { Search, MoreVertical, Phone, Video, X } from "lucide-react";
import type { ConversationData } from "../../services/chatApi";

interface Props {
  conversation: ConversationData | null;
  currentUserId?: number;
  onSearchMessages: (keyword: string) => void;
}

function getOtherMember(conv: ConversationData, currentUserId?: number) {
  return conv.members.find((m) => m.id !== currentUserId) ?? conv.members[0];
}

export default function ChatHeader({ conversation, currentUserId, onSearchMessages }: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  if (!conversation) {
    return (
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <span className="text-gray-400 text-sm">Select a conversation</span>
      </div>
    );
  }

  const other    = getOtherMember(conversation, currentUserId);
  const isOnline = other?.onlineStatus === "ONLINE";
  const initials = (other?.fullName ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSearch = (v: string) => {
    setSearchValue(v);
    onSearchMessages(v);
  };

  return (
    <header className="h-16 flex items-center justify-between px-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0 gap-3">
      {/* Left: avatar + name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          {other?.profileImage ? (
            <img
              src={other.profileImage}
              alt={other.fullName}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${
              isOnline ? "bg-emerald-400" : "bg-gray-400"
            }`}
          />
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {other?.fullName ?? "Unknown"}
          </p>
          <p className={`text-xs font-medium ${isOnline ? "text-emerald-500" : "text-gray-400"}`}>
            {isOnline ? "🟢 Online" : "⚪ Offline"}
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {showSearch ? (
          <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search messages..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-violet-400 w-48 transition"
              />
            </div>
            <button
              onClick={() => { setShowSearch(false); handleSearch(""); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <>
            <IconBtn icon={<Search size={16} />} title="Search messages" onClick={() => setShowSearch(true)} />
            <IconBtn icon={<Phone size={16} />} title="Voice call (coming soon)" onClick={() => {}} />
            <IconBtn icon={<Video size={16} />} title="Video call (coming soon)" onClick={() => {}} />
            <IconBtn icon={<MoreVertical size={16} />} title="More options" onClick={() => {}} />
          </>
        )}
      </div>
    </header>
  );
}

function IconBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
    >
      {icon}
    </button>
  );
}
