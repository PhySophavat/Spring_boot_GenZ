package com.ewallet.auth.dto;

import com.ewallet.user.dto.UserWithWalletResponse;

public record AuthResponse(
    String message,
    String accessToken,
    String tokenType,
    long expiresIn,
    UserWithWalletResponse user
) {
}
