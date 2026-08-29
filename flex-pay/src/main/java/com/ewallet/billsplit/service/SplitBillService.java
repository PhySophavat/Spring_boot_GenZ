package com.ewallet.billsplit.service;

import com.ewallet.billsplit.dto.CreateSplitBillRequest;
import com.ewallet.billsplit.dto.SplitBillResponse;

import java.util.List;

public interface SplitBillService {

    SplitBillResponse createSplitBill(Long creatorUserId, CreateSplitBillRequest request);

    SplitBillResponse getSplitBill(Long userId, Long splitBillId);

    List<SplitBillResponse> getSplitBillsForUser(Long userId);

    SplitBillResponse payMemberShare(Long payerUserId, Long splitBillId);

    void sendReminders(Long creatorUserId, Long splitBillId);
}
