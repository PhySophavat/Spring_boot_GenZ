package com.ewallet.auth.dto;

public record PinVerificationResponse(
    boolean valid,
    String message
) {
}
