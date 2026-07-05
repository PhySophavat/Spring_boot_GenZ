package com.ewallet.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.ewallet.auth.dto.LoginRequest;
import com.ewallet.auth.dto.RegisterRequest;
import com.ewallet.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest(properties = {
    "server.port=0",
    "spring.datasource.url=jdbc:postgresql://localhost:5432/flex_pay",
    "spring.datasource.username=postgres",
    "spring.datasource.password=12345",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "security.jwt.secret=flex-pay-test-secret-key-at-least-32-chars",
    "security.jwt.issuer=flex-pay-test-api"
})
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void registerThenLoginShouldSucceed() {
        String phone = "test-" + System.nanoTime();
        String password = "Secret123";

        try {
            var registerResponse = authService.register(
                new RegisterRequest("Test User", phone, password)
            );

            var savedUser = userRepository.findByPhone(phone).orElseThrow();

            assertThat(registerResponse.user().phone()).isEqualTo(phone);
            assertThat(savedUser.getPassword()).isNotBlank();
            assertThat(passwordEncoder.matches(password, savedUser.getPassword())).isTrue();

            var loginResponse = authService.login(new LoginRequest(phone, password));

            assertThat(loginResponse.user().phone()).isEqualTo(phone);
            assertThat(loginResponse.accessToken()).isNotBlank();
        } finally {
            userRepository.findByPhone(phone).ifPresent(userRepository::delete);
        }
    }
}
