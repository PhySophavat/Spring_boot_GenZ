/**
 * AdminChat.tsx — Main chat page.
 * Orchestrates all chat components using the useChat hook.
 *
 * Layout:
 * ┌──────────────┬───────────────────────────────────┐
 * │  ChatSidebar │  ChatHeader                        │
 * │              ├───────────────────────────────────┤
 * │              │  MessageList                       │
 * │              ├───────────────────────────────────┤
 * │              │  MessageInput                      │
 * └──────────────┴───────────────────────────────────┘
 */
import { useState } from "react";
import { useChat } from "../../hooks/useChat";
import { getSession } from "../../services/authService";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatHeader from "../../components/chat/ChatHeader";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import UserSearch from "../../components/chat/UserSearch";
import type { MemberInfo } from "../../services/chatApi";
import { MessageSquare } from "lucide-react";

export default function AdminChat() {
  const session = getSession();
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");

  const chat = useChat();

  // Derive currentUserId from session (mock uses name; real JWT would have ID)
  // For now we compare by role as a fallback — in production use the JWT sub ID
  const currentUserId: number = 0; // Overridden once we have real auth user ID

  const typingNames = chat.typingUsers.map((u) => u.fullName);

  const handleStartConversation = async (user: MemberInfo) => {
    await chat.startConversationWith(user);
  };

  // Filter messages by search keyword
  const displayMessages = messageSearch
    ? chat.messages.filter((m) =>
        m.content?.toLowerCase().includes(messageSearch.toLowerCase())
      )
    : chat.messages;

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-950 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Sidebar */}
      <ChatSidebar
        conversations={chat.conversations}
        selectedId={chat.selectedConversation?.id ?? null}
        isLoading={chat.isLoadingConversations}
        onSelect={chat.selectConversation}
        onNewChat={() => setShowUserSearch(true)}
        currentUserId={currentUserId}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
        {/* Header */}
        <ChatHeader
          conversation={chat.selectedConversation}
          currentUserId={currentUserId}
          onSearchMessages={setMessageSearch}
        />

        {chat.selectedConversation ? (
          <>
            {/* Messages */}
            <MessageList
              messages={displayMessages}
              isLoading={chat.isLoadingMessages}
              hasMore={chat.hasMoreMessages}
              currentUserId={currentUserId}
              typingNames={typingNames}
              onLoadMore={chat.loadOlderMessages}
              onReply={chat.setReplyTo}
              onEdit={chat.setEditing}
              onDelete={chat.submitDelete}
              onVisible={chat.markMessageRead}
            />

            {/* Error banner */}
            {chat.error && (
              <div className="px-4 py-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                ⚠️ {chat.error}
              </div>
            )}

            {/* Input */}
            <MessageInput
              disabled={!chat.selectedConversation}
              replyToMessage={chat.replyToMessage}
              editingMessage={chat.editingMessage}
              onSendText={(content, replyToId) =>
                chat.sendMessage({
                  content,
                  messageType: "TEXT",
                  replyToMessageId: replyToId,
                })
              }
              onSendFile={(payload) => chat.sendMessage(payload)}
              onCancelReply={() => chat.setReplyTo(null)}
              onCancelEdit={() => chat.setEditing(null)}
              onSubmitEdit={chat.submitEdit}
              onTyping={chat.sendTypingStart}
            />
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 dark:text-gray-600 p-8">
            <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <MessageSquare size={36} className="text-violet-500" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Your messages
              </p>
              <p className="text-sm text-gray-400 max-w-xs">
                Select a conversation from the sidebar or start a new one by clicking the{" "}
                <span className="text-violet-500 font-medium">+</span> button.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User search modal */}
      {showUserSearch && (
        <UserSearch
          onSelect={handleStartConversation}
          onClose={() => setShowUserSearch(false)}
        />
      )}
    </div>
  );
}
