package com.ewallet.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a chat message.
 * Sensitive fields (e.g. password hash) are never included.
 * Content is nulled out for deleted messages; isDeleted flag is kept for UI.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private Long id;
    private Long conversationId;
    private SenderInfo sender;
    private String content;
    private String messageType;        // TEXT | IMAGE | FILE
    private Long replyToMessageId;
    private MessageResponse replyToMessage; // Embedded preview of replied message
    private Boolean isEdited;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AttachmentInfo> attachments;
    private List<Long> readByUserIds;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SenderInfo {
        private Long id;
        private String fullName;
        private String profileImage;
        private String role;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentInfo {
        private Long id;
        private String fileName;
        private String fileUrl;
        private String fileType;
        private Long fileSize;
    }
}
