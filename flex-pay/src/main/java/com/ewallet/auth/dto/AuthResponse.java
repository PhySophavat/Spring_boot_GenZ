package com.ewallet.auth.dto;

import com.ewallet.users.dto.UserResponse;

public record AuthResponse(
    String message,
    String accessToken,
    String tokenType,
    long expiresIn,
    UserResponse user
) {
}
