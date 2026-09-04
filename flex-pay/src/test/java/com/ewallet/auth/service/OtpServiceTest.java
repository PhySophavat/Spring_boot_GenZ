package com.ewallet.auth.service;

import com.ewallet.auth.entity.OtpPurpose;
import com.ewallet.auth.entity.OtpVerification;
import com.ewallet.auth.repository.OtpVerificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private OtpVerificationRepository otpVerificationRepository;

    @InjectMocks
    private OtpService otpService;

    private final String testEmail = "user@test.com";

    @Test
    @DisplayName("generateAndSaveOtp: generates 6-digit OTP and saves entity with 10min expiry")
    void generateAndSaveOtp_savesValidOtp() {
        when(otpVerificationRepository.save(any(OtpVerification.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        String otp = otpService.generateAndSaveOtp(testEmail, OtpPurpose.REGISTRATION);

        assertThat(otp).matches("^\\d{6}$");

        ArgumentCaptor<OtpVerification> captor = ArgumentCaptor.forClass(OtpVerification.class);
        verify(otpVerificationRepository).save(captor.capture());

        OtpVerification saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo(testEmail);
        assertThat(saved.getOtpCode()).isEqualTo(otp);
        assertThat(saved.getPurpose()).isEqualTo(OtpPurpose.REGISTRATION);
        assertThat(saved.getVerified()).isFalse();
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(9));
    }

    @Test
    @DisplayName("verifyOtp: successfully marks OTP as verified when code matches and not expired")
    void verifyOtp_success() {
        OtpVerification otpVerification = OtpVerification.builder()
            .id(1L)
            .email(testEmail)
            .otpCode("123456")
            .purpose(OtpPurpose.REGISTRATION)
            .expiresAt(LocalDateTime.now().plusMinutes(5))
            .verified(false)
            .build();

        when(otpVerificationRepository.findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(eq(testEmail), eq(OtpPurpose.REGISTRATION)))
            .thenReturn(Optional.of(otpVerification));

        boolean result = otpService.verifyOtp(testEmail, "123456", OtpPurpose.REGISTRATION);

        assertThat(result).isTrue();
        assertThat(otpVerification.getVerified()).isTrue();
        verify(otpVerificationRepository).save(otpVerification);
    }

    @Test
    @DisplayName("verifyOtp: throws BAD_REQUEST when code does not match")
    void verifyOtp_wrongCode_throwsBadRequest() {
        OtpVerification otpVerification = OtpVerification.builder()
            .id(1L)
            .email(testEmail)
            .otpCode("123456")
            .purpose(OtpPurpose.REGISTRATION)
            .expiresAt(LocalDateTime.now().plusMinutes(5))
            .verified(false)
            .build();

        when(otpVerificationRepository.findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(eq(testEmail), eq(OtpPurpose.REGISTRATION)))
            .thenReturn(Optional.of(otpVerification));

        assertThatThrownBy(() -> otpService.verifyOtp(testEmail, "999999", OtpPurpose.REGISTRATION))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Invalid OTP code");
    }

    @Test
    @DisplayName("verifyOtp: throws BAD_REQUEST when OTP is expired")
    void verifyOtp_expired_throwsBadRequest() {
        OtpVerification otpVerification = OtpVerification.builder()
            .id(1L)
            .email(testEmail)
            .otpCode("123456")
            .purpose(OtpPurpose.REGISTRATION)
            .expiresAt(LocalDateTime.now().minusMinutes(1))
            .verified(false)
            .build();

        when(otpVerificationRepository.findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(eq(testEmail), eq(OtpPurpose.REGISTRATION)))
            .thenReturn(Optional.of(otpVerification));

        assertThatThrownBy(() -> otpService.verifyOtp(testEmail, "123456", OtpPurpose.REGISTRATION))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("OTP has expired");
    }

    @Test
    @DisplayName("verifyOtp: throws BAD_REQUEST when OTP is already verified")
    void verifyOtp_alreadyVerified_throwsBadRequest() {
        OtpVerification otpVerification = OtpVerification.builder()
            .id(1L)
            .email(testEmail)
            .otpCode("123456")
            .purpose(OtpPurpose.REGISTRATION)
            .expiresAt(LocalDateTime.now().plusMinutes(5))
            .verified(true)
            .build();

        when(otpVerificationRepository.findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(eq(testEmail), eq(OtpPurpose.REGISTRATION)))
            .thenReturn(Optional.of(otpVerification));

        assertThatThrownBy(() -> otpService.verifyOtp(testEmail, "123456", OtpPurpose.REGISTRATION))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("already been used");
    }
}
