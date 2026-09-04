package com.ewallet.auth.dto;

public record VerifyResetOtpResponse(
    boolean success,
    String resetToken,
    String message
) {
}
