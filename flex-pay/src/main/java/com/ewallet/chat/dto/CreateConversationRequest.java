package com.ewallet.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for creating a new conversation.
 */
@Data
public class CreateConversationRequest {

    /** The user ID of the other participant (admin-to-user DIRECT conversation) */
    @NotNull(message = "targetUserId is required")
    private Long targetUserId;
}
