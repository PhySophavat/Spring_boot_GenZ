package com.ewallet.payment.service;

import com.ewallet.payment.dto.PaymentRequest;
import com.ewallet.payment.dto.PaymentResponse;
import com.ewallet.payment.dto.SendMoneyRequest;
import com.ewallet.payment.dto.SendMoneyResponse;

public interface PaymentService {
    SendMoneyResponse sendMoney(Long senderUserId, SendMoneyRequest request);
    PaymentResponse processPayment(Long senderUserId, PaymentRequest request);
}
