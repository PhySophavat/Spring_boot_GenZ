package com.ewallet.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a conversation, including the last message preview
 * and unread count for the requesting admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    private Long id;
    private String type;
    private List<MemberInfo> members;
    private MessageResponse lastMessage;
    private int unreadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberInfo {
        private Long id;
        private String fullName;
        private String profileImage;
        private String role;
        private String onlineStatus; // ONLINE | OFFLINE
        private LocalDateTime lastSeen;
    }
}
