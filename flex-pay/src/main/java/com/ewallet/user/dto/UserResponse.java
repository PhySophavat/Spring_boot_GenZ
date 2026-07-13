package com.ewallet.user.dto;

import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String fullName,
    String phoneNumber,
    String email,
    LocalDateTime createdAt
) {
}
