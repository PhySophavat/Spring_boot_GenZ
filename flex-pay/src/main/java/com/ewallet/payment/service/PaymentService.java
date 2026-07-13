package com.ewallet.payment.service;

import com.ewallet.payment.dto.SendMoneyRequest;
import com.ewallet.payment.dto.SendMoneyResponse;

public interface PaymentService {
    SendMoneyResponse sendMoney(Long senderUserId, SendMoneyRequest request);
}
