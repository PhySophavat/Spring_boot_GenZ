package com.ewallet.chat.service;

import com.ewallet.chat.dto.ChatPaymentRequest;
import com.ewallet.chat.dto.ChatPaymentResponse;

public interface ChatPaymentService {

    /**
     * Executes an instant payment within a chat conversation.
     * Atomically transfers money from sender's Main Wallet to receiver's Main Wallet,
     * writes transaction and payment logs, and broadcasts a PAYMENT chat message.
     *
     * @param senderUserId Authenticated sender user ID
     * @param request Payment details (conversationId, receiverId, amount, optional message)
     * @return Completed payment response
     */
    ChatPaymentResponse processChatPayment(Long senderUserId, ChatPaymentRequest request);
}
