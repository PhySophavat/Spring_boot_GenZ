package com.ewallet.payment.service;

import com.ewallet.user.entity.User;
import com.ewallet.user.entity.UserPublicToken;

public interface QrCodeService {
    UserPublicToken getOrCreateToken(User user);
    byte[] generateQrPng(String tokenStr);
}
