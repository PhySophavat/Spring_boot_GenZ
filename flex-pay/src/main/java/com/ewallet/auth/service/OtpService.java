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
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OtpService {

    private final OtpVerificationRepository otpVerificationRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 45;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RESET_TOKEN_EXPIRY_MINUTES = 15;

    /**
     * Generates a 6-digit cryptographic OTP, enforces 45-second resend cooldown,
     * persists with 5-minute expiry, and returns the code.
     */
    public String generateAndSaveOtp(String email, OtpPurpose purpose) {
        String cleanEmail = email.trim().toLowerCase();
        OtpPurpose actualPurpose = purpose != null ? purpose : OtpPurpose.EMAIL_VERIFICATION;

        // Check cooldown on existing active OTP
        findLatestOtp(cleanEmail, actualPurpose).ifPresent(existing -> {
            if (existing.getLastResentAt() != null) {
                if (existing.getLastResentAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait 45 seconds before requesting a new code.");
                }
            } else if (existing.getCreatedAt() != null && existing.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait 45 seconds before requesting a new code.");
            }
        });

        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

        OtpVerification otpVerification = OtpVerification.builder()
            .email(cleanEmail)
            .otpCode(otpCode)
            .purpose(actualPurpose)
            .expiresAt(expiresAt)
            .verified(false)
            .attempts(0)
            .maxAttempts(MAX_ATTEMPTS)
            .lastResentAt(LocalDateTime.now())
            .build();

        otpVerificationRepository.save(otpVerification);
        log.info("Generated 6-digit OTP for email: {} [purpose: {}]", cleanEmail, actualPurpose);
        return otpCode;
    }

    /**
     * Verifies that the supplied OTP matches the latest unverified OTP for the given email and purpose.
     */
    public boolean verifyOtp(String email, String otpCode, OtpPurpose purpose) {
        String cleanEmail = email.trim().toLowerCase();
        String cleanOtp = otpCode != null ? otpCode.trim() : "";
        OtpPurpose actualPurpose = purpose != null ? purpose : OtpPurpose.EMAIL_VERIFICATION;

        OtpVerification otpVerification = findLatestOtp(cleanEmail, actualPurpose)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No OTP found for this email. Please request a new OTP."));

        if (Boolean.TRUE.equals(otpVerification.getVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This OTP has already been used. Please request a new OTP.");
        }

        if (otpVerification.getAttempts() >= otpVerification.getMaxAttempts()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Please request a new code.");
        }

        if (LocalDateTime.now().isAfter(otpVerification.getExpiresAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired. Please request a new OTP.");
        }

        if (!otpVerification.getOtpCode().equals(cleanOtp)) {
            otpVerification.setAttempts(otpVerification.getAttempts() + 1);
            otpVerificationRepository.save(otpVerification);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP code. Please check and try again.");
        }

        otpVerification.setVerified(true);
        otpVerificationRepository.save(otpVerification);
        log.info("OTP verified successfully for email: {} [purpose: {}]", cleanEmail, actualPurpose);
        return true;
    }

    /**
     * Verifies OTP and issues a short-lived reset authorization token.
     */
    public String verifyOtpAndGenerateResetToken(String email, String otpCode, OtpPurpose purpose) {
        verifyOtp(email, otpCode, purpose);

        String cleanEmail = email.trim().toLowerCase();
        OtpVerification otpVerification = findLatestOtp(cleanEmail, purpose)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification record not found."));

        String resetToken = UUID.randomUUID().toString().replace("-", "");
        otpVerification.setResetToken(resetToken);
        otpVerification.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRY_MINUTES));
        otpVerificationRepository.save(otpVerification);

        log.info("Issued reset token for email: {} [purpose: {}]", cleanEmail, purpose);
        return resetToken;
    }

    /**
     * Validates and invalidates a reset authorization token.
     */
    public void validateAndConsumeResetToken(String email, String resetToken) {
        String cleanEmail = email.trim().toLowerCase();
        String cleanToken = resetToken != null ? resetToken.trim() : "";

        if (cleanToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token is required.");
        }

        OtpVerification record = otpVerificationRepository
            .findTopByEmailIgnoreCaseAndResetTokenOrderByCreatedAtDesc(cleanEmail, cleanToken)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token."));

        if (record.getResetTokenExpiresAt() == null || LocalDateTime.now().isAfter(record.getResetTokenExpiresAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token has expired. Please start recovery again.");
        }

        // Invalidate token so it cannot be re-used
        record.setResetToken(null);
        record.setResetTokenExpiresAt(null);
        otpVerificationRepository.save(record);
        log.info("Consumed reset token for email: {}", cleanEmail);
    }

    /**
     * Checks if a recent OTP was successfully verified for this email and purpose within the last 15 minutes.
     */
    @Transactional(readOnly = true)
    public boolean isRecentlyVerified(String email, OtpPurpose purpose) {
        String cleanEmail = email.trim().toLowerCase();
        return findLatestOtp(cleanEmail, purpose)
            .filter(otp -> Boolean.TRUE.equals(otp.getVerified()))
            .filter(otp -> otp.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(15)))
            .isPresent();
    }

    private Optional<OtpVerification> findLatestOtp(String email, OtpPurpose purpose) {
        Optional<OtpVerification> opt = otpVerificationRepository
            .findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(email, purpose);

        if (opt.isEmpty() && (purpose == OtpPurpose.EMAIL_VERIFICATION || purpose == OtpPurpose.REGISTRATION)) {
            OtpPurpose alt = (purpose == OtpPurpose.EMAIL_VERIFICATION) ? OtpPurpose.REGISTRATION : OtpPurpose.EMAIL_VERIFICATION;
            opt = otpVerificationRepository.findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(email, alt);
        } else if (opt.isEmpty() && (purpose == OtpPurpose.PASSWORD_RESET || purpose == OtpPurpose.FORGOT_PASSWORD)) {
            OtpPurpose alt = (purpose == OtpPurpose.PASSWORD_RESET) ? OtpPurpose.FORGOT_PASSWORD : OtpPurpose.PASSWORD_RESET;
            opt = otpVerificationRepository.findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(email, alt);
        }
        return opt;
    }
}
