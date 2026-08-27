package com.ewallet.payment;

import com.ewallet.payment.service.QrCodeServiceImpl;
import com.ewallet.user.repository.UserPublicTokenRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.ByteArrayInputStream;

import static org.junit.jupiter.api.Assertions.*;

class QrCodeServiceTest {

    @Test
    void testGenerateAndDecodeQr() {
        UserPublicTokenRepository mockRepo = Mockito.mock(UserPublicTokenRepository.class);
        QrCodeServiceImpl service = new QrCodeServiceImpl(mockRepo);

        String samplePayload = "flexpay://pay?receiverId=FP-88294192&name=Phy+Sophavat&currency=USD";
        byte[] pngBytes = service.generateQrPng(samplePayload);
        assertNotNull(pngBytes);
        assertTrue(pngBytes.length > 0);

        String decoded = service.decodeQrImage(new ByteArrayInputStream(pngBytes));
        assertEquals("{\"token\":\"" + samplePayload + "\"}", decoded);
    }
}
