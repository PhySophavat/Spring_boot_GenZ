package com.ewallet.payment.service;

import com.ewallet.user.entity.User;
import com.ewallet.user.entity.UserPublicToken;
import com.ewallet.user.repository.UserPublicTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
@Transactional
public class QrCodeServiceImpl implements QrCodeService {

    private final UserPublicTokenRepository tokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public QrCodeServiceImpl(UserPublicTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    @Override
    public UserPublicToken getOrCreateToken(User user) {
        return tokenRepository.findByUserIdAndActiveTrue(user.getId())
            .orElseGet(() -> {
                UserPublicToken token = new UserPublicToken();
                token.setUser(user);
                token.setPublicToken(generateSecureToken());
                token.setActive(true);
                return tokenRepository.save(token);
            });
    }

    @Override
    public byte[] generateQrPng(String tokenStr) {
        String jsonPayload = String.format("{\"token\":\"%s\"}", tokenStr);
        try {
            com.google.zxing.qrcode.QRCodeWriter qrCodeWriter = new com.google.zxing.qrcode.QRCodeWriter();
            com.google.zxing.common.BitMatrix bitMatrix = qrCodeWriter.encode(
                jsonPayload,
                com.google.zxing.BarcodeFormat.QR_CODE,
                300,
                300
            );
            java.io.ByteArrayOutputStream pngOutputStream = new java.io.ByteArrayOutputStream();
            com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            return pngOutputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating QR code image", e);
        }
    }

    private String generateSecureToken() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder(16);
        for (int i = 0; i < 16; i++) {
            sb.append(chars.charAt(secureRandom.nextInt(chars.length())));
        }
        return "USR_" + sb.toString();
    }
}
