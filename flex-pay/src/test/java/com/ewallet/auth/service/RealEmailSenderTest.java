package com.ewallet.auth.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThatCode;

@SpringBootTest(properties = {
    "spring.config.import=optional:file:./application-local.properties"
})
class RealEmailSenderTest {

    @Autowired
    private EmailService emailService;

    @Test
    @DisplayName("Send live verification OTP email to physophavat@gmail.com")
    void sendLiveEmailTest() {
        String targetEmail = "physophavat@gmail.com";
        String otpCode = String.format("%06d", (int) (Math.random() * 1_000_000));

        System.out.println("==================================================");
        System.out.println("SENDING LIVE OTP EMAIL TO: " + targetEmail);
        System.out.println("GENERATED OTP CODE: " + otpCode);
        System.out.println("==================================================");

        assertThatCode(() -> emailService.sendOtpEmail(targetEmail, otpCode))
            .doesNotThrowAnyException();

        System.out.println("==================================================");
        System.out.println("SUCCESSFULLY DELIVERED LIVE OTP EMAIL TO: " + targetEmail);
        System.out.println("==================================================");
    }
}
