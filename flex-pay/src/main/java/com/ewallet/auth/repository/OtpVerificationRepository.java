package com.ewallet.auth.repository;

import com.ewallet.auth.entity.OtpPurpose;
import com.ewallet.auth.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(
        String email,
        OtpPurpose purpose
    );

    Optional<OtpVerification> findTopByEmailIgnoreCaseAndOtpCodeAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(
        String email,
        String otpCode,
        OtpPurpose purpose
    );

    void deleteByExpiresAtBefore(LocalDateTime time);
}
