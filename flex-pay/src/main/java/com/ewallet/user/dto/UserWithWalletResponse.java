package com.ewallet.user.dto;

import java.time.LocalDateTime;

public record UserWithWalletResponse(
    Long id,
    String fullName,
    String phoneNumber,
    String email,
    LocalDateTime createdAt,
    Long walletId,
    String walletIdString,
    String walletNumber,
    boolean hasPin
) {
}
