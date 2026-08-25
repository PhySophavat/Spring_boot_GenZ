package com.ewallet.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * WebSocket event broadcast when a user's online/offline status changes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusEvent {

    private Long userId;
    /** ONLINE or OFFLINE */
    private String status;
    private LocalDateTime lastSeen;
}
