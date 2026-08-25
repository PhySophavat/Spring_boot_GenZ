package com.ewallet.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WebSocket event for typing indicator.
 * Sent when admin or user starts/stops typing in a conversation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingEvent {

    private Long conversationId;
    private Long userId;
    private String userFullName;
    /** TYPING_START or TYPING_STOP */
    private String eventType;
}
