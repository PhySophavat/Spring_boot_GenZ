package com.ewallet.auth.service;

import com.ewallet.auth.entity.OtpPurpose;
import com.ewallet.auth.entity.OtpVerification;
import com.ewallet.auth.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OtpService {

    private final OtpVerificationRepository otpVerificationRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generates a 6-digit cryptographic OTP, persists it with a 10-minute expiry,
     * and returns the generated code.
     */
    public String generateAndSaveOtp(String email, OtpPurpose purpose) {
        String cleanEmail = email.trim().toLowerCase();
        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

        OtpVerification otpVerification = OtpVerification.builder()
            .email(cleanEmail)
            .otpCode(otpCode)
            .purpose(purpose)
            .expiresAt(expiresAt)
            .verified(false)
            .build();

        otpVerificationRepository.save(otpVerification);
        log.info("Generated OTP for email: {} [purpose: {}]", cleanEmail, purpose);
        return otpCode;
    }

    /**
     * Verifies that the supplied OTP matches the latest unverified OTP for the given email and purpose,
     * and has not expired.
     */
    public boolean verifyOtp(String email, String otpCode, OtpPurpose purpose) {
        String cleanEmail = email.trim().toLowerCase();
        String cleanOtp = otpCode != null ? otpCode.trim() : "";

        OtpVerification otpVerification = otpVerificationRepository
            .findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(cleanEmail, purpose)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No OTP found for this email. Please request a new OTP."));

        if (Boolean.TRUE.equals(otpVerification.getVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This OTP has already been used. Please request a new OTP.");
        }

        if (LocalDateTime.now().isAfter(otpVerification.getExpiresAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired. Please request a new OTP.");
        }

        if (!otpVerification.getOtpCode().equals(cleanOtp)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP code. Please check and try again.");
        }

        otpVerification.setVerified(true);
        otpVerificationRepository.save(otpVerification);
        log.info("OTP successfully verified for email: {} [purpose: {}]", cleanEmail, purpose);
        return true;
    }

    /**
     * Checks if a recent OTP was successfully verified for this email and purpose within the last 15 minutes.
     */
    @Transactional(readOnly = true)
    public boolean isRecentlyVerified(String email, OtpPurpose purpose) {
        String cleanEmail = email.trim().toLowerCase();
        return otpVerificationRepository
            .findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(cleanEmail, purpose)
            .filter(otp -> Boolean.TRUE.equals(otp.getVerified()))
            .filter(otp -> otp.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(15)))
            .isPresent();
    }
}
