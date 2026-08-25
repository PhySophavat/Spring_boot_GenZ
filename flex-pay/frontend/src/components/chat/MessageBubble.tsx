/**
 * MessageBubble.tsx — Individual message bubble with full feature set:
 * - Sent/received alignment
 * - Avatar + sender name
 * - Reply thread preview
 * - Edit/delete context menu (hover)
 * - Read receipt ticks (✓ / ✓✓ / blue ✓✓)
 * - Image/file attachment preview
 * - Deleted message placeholder
 * - Edited indicator
 */
import { useState } from "react";
import { Check, CheckCheck, Edit2, Trash2, Reply, FileText, Image } from "lucide-react";
import type { MessageData } from "../../services/chatApi";

interface Props {
  message: MessageData;
  isMine: boolean;
  currentUserId: number;
  onReply: (msg: MessageData) => void;
  onEdit: (msg: MessageData) => void;
  onDelete: (msgId: number) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ReadTick({ readByUserIds, isMine }: { readByUserIds: number[]; isMine: boolean }) {
  if (!isMine) return null;
  if (readByUserIds.length === 0) return <Check size={12} className="text-gray-400" />;
  return <CheckCheck size={12} className="text-violet-400" />;
}

export default function MessageBubble({
  message,
  isMine,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);

  const isDeleted = message.isDeleted;
  const attachment = message.attachments?.[0];
  const isImage = attachment?.fileType?.startsWith("image/");

  const initials = (message.sender.fullName ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`group flex items-end gap-2 px-4 py-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Avatar (only for received messages) */}
      {!isMine && (
        <div className="flex-shrink-0 mb-1">
          {message.sender.profileImage ? (
            <img
              src={message.sender.profileImage}
              alt={message.sender.fullName}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {initials}
            </div>
          )}
        </div>
      )}

      {/* Bubble + context menu */}
      <div className="flex flex-col max-w-[70%] gap-0.5">
        {/* Sender name (only for received) */}
        {!isMine && (
          <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1 font-medium">
            {message.sender.fullName}
          </span>
        )}

        {/* Reply preview */}
        {message.replyToMessage && (
          <div className={`flex text-xs border-l-2 pl-2 py-0.5 mb-1 rounded ${isMine ? "border-violet-400 text-gray-300 bg-violet-800/30" : "border-gray-400 text-gray-500 bg-gray-100 dark:bg-gray-800"}`}>
            <span className="truncate">
              {message.replyToMessage.isDeleted
                ? "🗑 Deleted message"
                : message.replyToMessage.content ?? "📎 Attachment"}
            </span>
          </div>
        )}

        {/* Main bubble */}
        <div className={`relative rounded-2xl px-3.5 py-2 shadow-sm ${
          isDeleted
            ? "bg-gray-100 dark:bg-gray-800 opacity-60 italic"
            : isMine
            ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700"
        }`}>

          {isDeleted ? (
            <p className="text-sm text-gray-400">🗑 This message was deleted</p>
          ) : (
            <>
              {/* Image attachment */}
              {isImage && attachment && (
                <a href={`http://localhost:8082${attachment.fileUrl}`} target="_blank" rel="noreferrer">
                  <img
                    src={`http://localhost:8082${attachment.fileUrl}`}
                    alt={attachment.fileName}
                    className="rounded-xl max-w-xs max-h-64 object-cover mb-1 hover:opacity-90 transition"
                  />
                </a>
              )}

              {/* File attachment */}
              {!isImage && attachment && (
                <a
                  href={`http://localhost:8082${attachment.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${isMine ? "bg-white/10 hover:bg-white/20" : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"} transition`}
                >
                  <FileText size={16} className="flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{attachment.fileName}</span>
                </a>
              )}

              {/* Text content */}
              {message.content && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </>
          )}

          {/* Time + read tick */}
          <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMine ? "text-violet-200" : "text-gray-400"}`}>
            {message.isEdited && !isDeleted && (
              <span className="text-[10px] italic opacity-70">edited</span>
            )}
            <span className="text-[10px]">{formatTime(message.createdAt)}</span>
            <ReadTick readByUserIds={message.readByUserIds} isMine={isMine} />
          </div>
        </div>
      </div>

      {/* Context menu (visible on hover) */}
      {!isDeleted && showMenu && (
        <div className={`flex items-center gap-0.5 mb-3 ${isMine ? "flex-row" : "flex-row-reverse"} animate-in fade-in duration-150`}>
          <MenuBtn icon={<Reply size={13} />} title="Reply" onClick={() => onReply(message)} />
          {isMine && (
            <MenuBtn icon={<Edit2 size={13} />} title="Edit" onClick={() => onEdit(message)} />
          )}
          <MenuBtn
            icon={<Trash2 size={13} />}
            title="Delete"
            danger
            onClick={() => onDelete(message.id)}
          />
        </div>
      )}
    </div>
  );
}

function MenuBtn({
  icon, title, onClick, danger,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-lg transition ${
        danger
          ? "text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
          : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {icon}
    </button>
  );
}
