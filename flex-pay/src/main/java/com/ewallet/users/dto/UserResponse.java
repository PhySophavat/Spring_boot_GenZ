package com.ewallet.users.dto;

import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String fullName,
    String phone,
    String email,
    LocalDateTime createdAt
) {
}
