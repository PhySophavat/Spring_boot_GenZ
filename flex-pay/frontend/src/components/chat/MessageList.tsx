/**
 * MessageList.tsx — Scrollable message area with:
 * - Infinite scroll (scroll to top loads older messages)
 * - Auto-scroll to bottom on new messages
 * - Date separators
 * - Loading spinner for older messages
 * - Empty state
 */
import { useEffect, useRef, useCallback } from "react";
import type { MessageData } from "../../services/chatApi";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { MessageSquare, Loader2 } from "lucide-react";

interface Props {
  messages: MessageData[];
  isLoading: boolean;
  hasMore: boolean;
  currentUserId: number;
  typingNames: string[];
  onLoadMore: () => void;
  onReply: (msg: MessageData) => void;
  onEdit: (msg: MessageData) => void;
  onDelete: (msgId: number) => void;
  onVisible: (msgId: number) => void;  // trigger read receipt
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function MessageList({
  messages,
  isLoading,
  hasMore,
  currentUserId,
  typingNames,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onVisible,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);
  const prevLen   = useRef(0);
  const isAtBottom = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevLen.current && isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLen.current = messages.length;
  }, [messages]);

  // IntersectionObserver for read receipts on visible messages
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const msgId = Number(entry.target.getAttribute("data-msg-id"));
            if (msgId) onVisible(msgId);
          }
        });
      },
      { threshold: 0.5 }
    );

    const els = listRef.current?.querySelectorAll("[data-msg-id]") ?? [];
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [messages, onVisible]);

  // Infinite scroll: detect when user scrolls to top
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    if (el.scrollTop < 80 && hasMore && !isLoading) {
      const prevScrollHeight = el.scrollHeight;
      onLoadMore();
      // Restore scroll position after prepend
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevScrollHeight;
      });
    }
  }, [hasMore, isLoading, onLoadMore]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-600">
        <MessageSquare size={48} className="opacity-20" />
        <p className="text-sm">No messages yet — say hello! 👋</p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto flex flex-col gap-0 py-2 scroll-smooth"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Load more spinner */}
      {isLoading && (
        <div className="flex justify-center py-3">
          <Loader2 size={18} className="text-violet-400 animate-spin" />
        </div>
      )}

      {messages.map((msg, i) => {
        const showDate =
          i === 0 || !isSameDay(messages[i - 1].createdAt, msg.createdAt);

        return (
          <div key={msg.id} data-msg-id={msg.id}>
            {showDate && (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-[11px] text-gray-400 font-medium bg-white dark:bg-gray-900 px-2">
                  {formatDateLabel(msg.createdAt)}
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            )}
            <MessageBubble
              message={msg}
              isMine={msg.sender.id === currentUserId}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        );
      })}

      {/* Typing indicator */}
      <TypingIndicator names={typingNames} />

      {/* Anchor for auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
