package com.ewallet.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for sending a new text message.
 * File/image messages are handled via the /upload endpoint first,
 * then referenced here by attaching the returned file URL.
 */
@Data
public class SendMessageRequest {

    @NotNull(message = "conversationId is required")
    private Long conversationId;

    /** Message body; may be null for pure file/image messages */
    @Size(max = 10000, message = "Message content cannot exceed 10000 characters")
    private String content;

    /** TEXT | IMAGE | FILE */
    @NotBlank(message = "messageType is required")
    private String messageType;

    /** Optional: ID of the message being replied to */
    private Long replyToMessageId;

    /** Optional: pre-uploaded file URL returned by /api/admin/chat/upload */
    private String fileUrl;

    /** Optional: original file name for display */
    private String fileName;

    /** Optional: MIME type returned by upload endpoint */
    private String fileType;

    /** Optional: file size in bytes */
    private Long fileSize;
}
