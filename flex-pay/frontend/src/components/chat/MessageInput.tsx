/**
 * MessageInput.tsx — Compose area with:
 * - Text input with Enter-to-send (Shift+Enter for newline)
 * - File/image picker with preview
 * - Reply-to banner
 * - Edit mode banner
 * - Emoji support (text input)
 * - Character counter hint
 * - Typing event emission on keystroke
 */
import { useRef, useState, type KeyboardEvent, type ChangeEvent } from "react";
import {
  Paperclip, Send, Smile, X, Image, Reply, Edit2, Loader2,
} from "lucide-react";
import type { MessageData } from "../../services/chatApi";
import { uploadFile } from "../../services/chatApi";

interface Props {
  disabled?: boolean;
  replyToMessage?: MessageData | null;
  editingMessage?: MessageData | null;
  onSendText: (text: string, replyToId?: number) => void;
  onSendFile: (payload: {
    content?: string;
    messageType: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    replyToMessageId?: number;
  }) => void;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: (content: string) => void;
  onTyping: () => void;
}

const EMOJI_SHORTCUTS: Record<string, string> = {
  ":)": "😊", ":D": "😄", ":(": "😢", ":heart:": "❤️",
  ":thumbsup:": "👍", ":wave:": "👋", ":fire:": "🔥",
};

export default function MessageInput({
  disabled,
  replyToMessage,
  editingMessage,
  onSendText,
  onSendFile,
  onCancelReply,
  onCancelEdit,
  onSubmitEdit,
  onTyping,
}: Props) {
  const [text, setText] = useState(editingMessage?.content ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync text when editingMessage changes
  const prevEditId = useRef<number | undefined>();
  if (editingMessage?.id !== prevEditId.current) {
    prevEditId.current = editingMessage?.id;
    if (editingMessage) setText(editingMessage.content ?? "");
    else if (!replyToMessage) setText("");
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping();
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingMessage) {
      onSubmitEdit(trimmed);
      setText("");
      return;
    }

    // Replace emoji shortcuts
    const withEmoji = trimmed.replace(
      /:\w+:|:\)|:\(|:D/g,
      (m) => EMOJI_SHORTCUTS[m] ?? m
    );
    onSendText(withEmoji, replyToMessage?.id);
    setText("");
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsUploading(true);
    try {
      const result = await uploadFile(file);
      const msgType = result.fileType.startsWith("image/") ? "IMAGE" : "FILE";
      onSendFile({
        content: text.trim() || undefined,
        messageType: msgType,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        fileType: result.fileType,
        fileSize: result.fileSize,
        replyToMessageId: replyToMessage?.id,
      });
      setText("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      alert(`Upload error: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const isEditing = Boolean(editingMessage);

  return (
    <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Reply/Edit banner */}
      {(replyToMessage || editingMessage) && (
        <div className={`flex items-center gap-2 px-4 py-2 border-b text-xs font-medium ${
          isEditing
            ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
            : "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400"
        }`}>
          {isEditing ? <Edit2 size={12} /> : <Reply size={12} />}
          <span className="flex-1 truncate">
            {isEditing
              ? `Editing message: "${editingMessage?.content?.slice(0, 60) ?? ""}..."`
              : `Replying to: "${replyToMessage?.content?.slice(0, 60) ?? "Attachment"}"`}
          </span>
          <button
            onClick={isEditing ? onCancelEdit : onCancelReply}
            className="hover:opacity-80"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-3">
        {/* File attach */}
        <button
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.docx"
          onChange={handleFileChange}
        />

        {/* Text area */}
        <div className="flex-1 relative">
          <textarea
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isEditing ? "Edit your message..." : "Type a message... (Enter to send)"}
            disabled={disabled}
            className="w-full resize-none rounded-xl px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-400 transition max-h-32 overflow-y-auto"
            style={{ minHeight: "42px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 128) + "px";
            }}
          />
        </div>

        {/* Emoji hint */}
        <button
          title=":) → 😊  :D → 😄  :heart: → ❤️"
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Smile size={16} />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !isUploading)}
          title="Send (Enter)"
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
