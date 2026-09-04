package com.ewallet.auth.dto;

import com.ewallet.auth.entity.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerifyOtpRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    String email,

    @NotBlank(message = "OTP is required")
    String otp,

    OtpPurpose purpose
) {
}
