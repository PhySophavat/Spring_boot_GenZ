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

    @Override
    public String decodeQrImage(java.io.InputStream inputStream) {
        try {
            java.awt.image.BufferedImage originalImage = javax.imageio.ImageIO.read(inputStream);
            if (originalImage == null) {
                throw new IllegalArgumentException("Invalid image file: could not parse image data.");
            }

            // Ensure solid white background if image has transparency or alpha channel
            java.awt.image.BufferedImage rgbImage = new java.awt.image.BufferedImage(
                originalImage.getWidth(),
                originalImage.getHeight(),
                java.awt.image.BufferedImage.TYPE_INT_RGB
            );
            java.awt.Graphics2D g2d = rgbImage.createGraphics();
            g2d.setColor(java.awt.Color.WHITE);
            g2d.fillRect(0, 0, rgbImage.getWidth(), rgbImage.getHeight());
            g2d.drawImage(originalImage, 0, 0, null);
            g2d.dispose();

            com.google.zxing.LuminanceSource source = new com.google.zxing.client.j2se.BufferedImageLuminanceSource(rgbImage);
            
            java.util.Map<com.google.zxing.DecodeHintType, Object> hints = new java.util.EnumMap<>(com.google.zxing.DecodeHintType.class);
            hints.put(com.google.zxing.DecodeHintType.TRY_HARDER, Boolean.TRUE);
            hints.put(com.google.zxing.DecodeHintType.POSSIBLE_FORMATS, java.util.List.of(com.google.zxing.BarcodeFormat.QR_CODE));

            com.google.zxing.Result result = tryDecodeWithFallbacks(source, hints);
            if (result != null) {
                return result.getText();
            }

            // Fallback: Center crop for full-screen screenshots
            int w = source.getWidth();
            int h = source.getHeight();
            if (w > 200 && h > 200) {
                int cropW = (int) (w * 0.75);
                int cropH = (int) (h * 0.75);
                int cropX = (w - cropW) / 2;
                int cropY = (h - cropH) / 2;
                com.google.zxing.LuminanceSource cropped = source.crop(cropX, cropY, cropW, cropH);
                result = tryDecodeWithFallbacks(cropped, hints);
                if (result != null) {
                    return result.getText();
                }
            }

            throw new IllegalArgumentException("No readable QR code found in the image.");
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to decode QR code: " + e.getMessage(), e);
        }
    }

    private com.google.zxing.Result tryDecodeWithFallbacks(
        com.google.zxing.LuminanceSource source,
        java.util.Map<com.google.zxing.DecodeHintType, Object> hints
    ) {
        // 1. Hybrid Binarizer
        try {
            com.google.zxing.BinaryBitmap bitmap = new com.google.zxing.BinaryBitmap(new com.google.zxing.common.HybridBinarizer(source));
            return new com.google.zxing.MultiFormatReader().decode(bitmap, hints);
        } catch (com.google.zxing.NotFoundException ignored) {}

        // 2. Global Histogram Binarizer
        try {
            com.google.zxing.BinaryBitmap altBitmap = new com.google.zxing.BinaryBitmap(new com.google.zxing.common.GlobalHistogramBinarizer(source));
            return new com.google.zxing.MultiFormatReader().decode(altBitmap, hints);
        } catch (com.google.zxing.NotFoundException ignored) {}

        // 3. Inverted Luminance (for Dark Mode screenshots or inverted modules)
        try {
            com.google.zxing.LuminanceSource invSource = source.invert();
            com.google.zxing.BinaryBitmap invBitmap = new com.google.zxing.BinaryBitmap(new com.google.zxing.common.HybridBinarizer(invSource));
            return new com.google.zxing.MultiFormatReader().decode(invBitmap, hints);
        } catch (com.google.zxing.NotFoundException ignored) {}

        try {
            com.google.zxing.LuminanceSource invSource = source.invert();
            com.google.zxing.BinaryBitmap invAltBitmap = new com.google.zxing.BinaryBitmap(new com.google.zxing.common.GlobalHistogramBinarizer(invSource));
            return new com.google.zxing.MultiFormatReader().decode(invAltBitmap, hints);
        } catch (com.google.zxing.NotFoundException ignored) {}

        return null;
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
