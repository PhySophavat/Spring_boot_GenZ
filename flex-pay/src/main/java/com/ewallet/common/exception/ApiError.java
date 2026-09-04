package com.ewallet.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
    int status,
    String message,
    LocalDateTime timestamp,
    boolean success,
    String code
) {
    public ApiError(int status, String message, LocalDateTime timestamp) {
        this(status, message, timestamp, false, resolveCode(status, message));
    }

    public ApiError(int status, String message, LocalDateTime timestamp, String code) {
        this(status, message, timestamp, false, code);
    }

    private static String resolveCode(int status, String message) {
        if (message == null) return "SERVER_ERROR";
        String lower = message.toLowerCase();
        if (lower.contains("already registered") || lower.contains("already exists")) return "EMAIL_ALREADY_EXISTS";
        if (lower.contains("invalid email")) return "INVALID_EMAIL";
        if (lower.contains("invalid otp") || lower.contains("incorrect verification code")) return "INVALID_OTP";
        if (lower.contains("expired")) return "OTP_EXPIRED";
        if (lower.contains("too many attempts")) return "OTP_TOO_MANY_ATTEMPTS";
        if (lower.contains("wait") || lower.contains("resend")) return "OTP_RESEND_LIMIT";
        if (lower.contains("password")) return "INVALID_PASSWORD";
        if (lower.contains("locked")) return "PIN_LOCKED";
        if (lower.contains("pin")) return "INVALID_PIN";
        if (lower.contains("token")) return "RESET_TOKEN_EXPIRED";
        if (status == 400) return "VALIDATION_ERROR";
        if (status == 401) return "INVALID_CREDENTIALS";
        if (status == 403) return "EMAIL_NOT_VERIFIED";
        return "SERVER_ERROR";
    }
}
