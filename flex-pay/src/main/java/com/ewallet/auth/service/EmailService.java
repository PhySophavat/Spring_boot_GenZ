package com.ewallet.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:b7d38d001@smtp-brevo.com}")
    private String fromEmail;

    @Value("${app.mail.from-name:FlexPay}")
    private String fromName;

    public void sendOtpEmail(String email, String otp) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        try {
            helper.setFrom(fromEmail, fromName);
        } catch (Exception e) {
            helper.setFrom(fromEmail);
        }

        helper.setTo(email);
        helper.setSubject("FlexPay OTP Verification");

        String htmlTemplate = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>FlexPay OTP Verification</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        background-color: #f8fafc;
                        margin: 0;
                        padding: 24px;
                        color: #1e293b;
                    }
                    .email-container {
                        max-width: 480px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 16px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                        overflow: hidden;
                        border: 1px solid #e2e8f0;
                    }
                    .header {
                        background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                        padding: 32px 24px;
                        text-align: center;
                    }
                    .header h1 {
                        color: #ffffff;
                        margin: 0;
                        font-size: 26px;
                        font-weight: 700;
                        letter-spacing: -0.5px;
                    }
                    .content {
                        padding: 32px 28px;
                    }
                    .content p {
                        font-size: 15px;
                        line-height: 1.6;
                        color: #475569;
                        margin: 0 0 16px;
                    }
                    .otp-box {
                        background: #ecfdf5;
                        border: 2px dashed #10b981;
                        border-radius: 12px;
                        padding: 20px;
                        text-align: center;
                        margin: 24px 0;
                    }
                    .otp-code {
                        font-size: 36px;
                        font-weight: 800;
                        letter-spacing: 8px;
                        color: #065f46;
                        font-family: 'Courier New', Courier, monospace;
                    }
                    .expiry-badge {
                        display: inline-block;
                        background: #fee2e2;
                        color: #b91c1c;
                        font-size: 12px;
                        font-weight: 600;
                        padding: 4px 12px;
                        border-radius: 20px;
                        margin-top: 10px;
                    }
                    .warning {
                        font-size: 13px;
                        color: #94a3b8;
                        border-top: 1px solid #f1f5f9;
                        padding-top: 20px;
                        margin-top: 24px;
                        line-height: 1.5;
                    }
                    .footer {
                        background-color: #f8fafc;
                        padding: 18px;
                        text-align: center;
                        font-size: 12px;
                        color: #94a3b8;
                        border-top: 1px solid #e2e8f0;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>FlexPay Verification</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>You requested a One-Time Password (OTP) for your FlexPay account verification. Please enter the code below to proceed:</p>
                        <div class="otp-box">
                            <div class="otp-code">{{OTP_CODE}}</div>
                            <div class="expiry-badge">Valid for 10 minutes</div>
                        </div>
                        <div class="warning">
                            If you did not request this OTP code, please ignore this email or contact FlexPay support if you suspect unauthorized activity.
                        </div>
                    </div>
                    <div class="footer">
                        &copy; 2026 FlexPay Mobile & Web Wallet. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
            """;

        String htmlContent = htmlTemplate.replace("{{OTP_CODE}}", otp);
        helper.setText(htmlContent, true);
        mailSender.send(message);
        log.info("OTP email successfully sent to {}", email);
    }
}
