package com.ewallet.billsplit.service;

import com.ewallet.billsplit.dto.CreateSplitBillRequest;
import com.ewallet.billsplit.dto.SplitBillMemberResponse;
import com.ewallet.billsplit.dto.SplitBillResponse;
import com.ewallet.billsplit.entity.SplitBill;
import com.ewallet.billsplit.entity.SplitBillMember;
import com.ewallet.billsplit.repository.SplitBillMemberRepository;
import com.ewallet.billsplit.repository.SplitBillRepository;
import com.ewallet.notification.entity.Notification;
import com.ewallet.notification.repository.NotificationRepository;
import com.ewallet.transaction.entity.Transaction;
import com.ewallet.transaction.repository.TransactionRepository;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import com.ewallet.wallet.entity.Wallet;
import com.ewallet.wallet.repository.WalletRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SplitBillServiceImpl implements SplitBillService {

    private final SplitBillRepository splitBillRepository;
    private final SplitBillMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;

    public SplitBillServiceImpl(
            SplitBillRepository splitBillRepository,
            SplitBillMemberRepository memberRepository,
            UserRepository userRepository,
            WalletRepository walletRepository,
            TransactionRepository transactionRepository,
            NotificationRepository notificationRepository
    ) {
        this.splitBillRepository = splitBillRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public SplitBillResponse createSplitBill(Long creatorUserId, CreateSplitBillRequest request) {
        if (request.getTotalAmount() == null || request.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total amount must be greater than 0");
        }

        List<Long> friendIds = request.getFriendIds();
        if (friendIds == null || friendIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User must select at least 1 friend");
        }

        if (friendIds.contains(creatorUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User cannot split with themselves");
        }

        // Deduplicate friend IDs
        Set<Long> uniqueFriendIds = new LinkedHashSet<>(friendIds);
        uniqueFriendIds.remove(creatorUserId);

        User creator = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator user not found"));

        List<User> friends = userRepository.findAllById(uniqueFriendIds);
        if (friends.size() != uniqueFriendIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more selected friends do not exist");
        }

        SplitBill splitBill = new SplitBill();
        splitBill.setCreator(creator);
        splitBill.setTotalAmount(request.getTotalAmount());
        splitBill.setNote(request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : "Dinner with Friends");
        splitBill.setStatus("PENDING");

        String splitType = "CUSTOM".equalsIgnoreCase(request.getSplitType()) ? "CUSTOM" : "EQUAL";
        splitBill.setSplitType(splitType);

        BigDecimal totalAmount = request.getTotalAmount();
        int participantsCount = friends.size() + 1; // creator + friends

        if ("EQUAL".equals(splitType)) {
            BigDecimal baseShare = totalAmount.divide(BigDecimal.valueOf(participantsCount), 2, RoundingMode.HALF_UP);
            BigDecimal friendsTotal = baseShare.multiply(BigDecimal.valueOf(friends.size()));
            BigDecimal creatorShare = totalAmount.subtract(friendsTotal);

            // Creator member (already paid full bill up front)
            SplitBillMember creatorMember = new SplitBillMember();
            creatorMember.setUser(creator);
            creatorMember.setAmount(creatorShare);
            creatorMember.setStatus("PAID");
            creatorMember.setPaidAt(LocalDateTime.now());
            splitBill.addMember(creatorMember);

            // Friends members
            for (User friend : friends) {
                SplitBillMember friendMember = new SplitBillMember();
                friendMember.setUser(friend);
                friendMember.setAmount(baseShare);
                friendMember.setStatus("PENDING");
                splitBill.addMember(friendMember);
            }
        } else {
            // CUSTOM split
            Map<Long, BigDecimal> customShares = request.getCustomShares();
            if (customShares == null || customShares.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom shares must be provided for CUSTOM split");
            }

            BigDecimal sumShares = BigDecimal.ZERO;
            // Validate all friends have shares
            for (User friend : friends) {
                BigDecimal share = customShares.get(friend.getId());
                if (share == null || share.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Every friend must have an amount greater than 0");
                }
                sumShares = sumShares.add(share);
            }

            BigDecimal creatorShare = customShares.get(creator.getId());
            if (creatorShare == null) {
                creatorShare = totalAmount.subtract(sumShares);
            } else {
                sumShares = sumShares.add(creatorShare);
            }

            if (sumShares.compareTo(totalAmount) != 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amounts must equal the total bill ($" + totalAmount + ")");
            }

            SplitBillMember creatorMember = new SplitBillMember();
            creatorMember.setUser(creator);
            creatorMember.setAmount(creatorShare);
            creatorMember.setStatus("PAID");
            creatorMember.setPaidAt(LocalDateTime.now());
            splitBill.addMember(creatorMember);

            for (User friend : friends) {
                SplitBillMember friendMember = new SplitBillMember();
                friendMember.setUser(friend);
                friendMember.setAmount(customShares.get(friend.getId()));
                friendMember.setStatus("PENDING");
                splitBill.addMember(friendMember);
            }
        }

        SplitBill saved = splitBillRepository.save(splitBill);

        // Dispatch notifications to friends
        for (SplitBillMember member : saved.getMembers()) {
            if (!member.getUser().getId().equals(creator.getId())) {
                Notification notification = new Notification();
                notification.setUser(member.getUser());
                notification.setTitle("Payment Request");
                notification.setMessage(creator.getFullName() + " requested $" + member.getAmount().setScale(2) + " from you for " + saved.getNote());
                notification.setType("SPLIT_BILL_REQUEST");
                notification.setReferenceId(saved.getId());
                notification.setIsRead(false);
                notificationRepository.save(notification);
            }
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SplitBillResponse getSplitBill(Long userId, Long splitBillId) {
        SplitBill splitBill = splitBillRepository.findByIdWithMembers(splitBillId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Split bill not found"));

        boolean isParticipant = splitBill.getCreator().getId().equals(userId) ||
                splitBill.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(userId));

        if (!isParticipant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not allowed to access this split bill");
        }

        return mapToResponse(splitBill);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SplitBillResponse> getSplitBillsForUser(Long userId) {
        List<SplitBill> list = splitBillRepository.findAllForUser(userId);
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public SplitBillResponse payMemberShare(Long payerUserId, Long splitBillId) {
        SplitBill splitBill = splitBillRepository.findById(splitBillId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Split bill not found"));

        if ("COMPLETED".equals(splitBill.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Split bill is already completed");
        }
        if ("CANCELLED".equals(splitBill.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Split bill has been cancelled");
        }

        SplitBillMember member = memberRepository.findBySplitBillIdAndUserId(splitBillId, payerUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a member of this split bill"));

        if ("PAID".equals(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already paid your share for this split bill");
        }

        User creator = splitBill.getCreator();
        if (payerUserId.equals(creator.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Creator cannot pay their own share");
        }

        Wallet payerWallet = walletRepository.findByUserId(payerUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payer wallet not found"));

        Wallet creatorWallet = walletRepository.findByUserId(creator.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator wallet not found"));

        // Deterministic lock ordering to prevent deadlock
        Wallet firstLock, secondLock;
        if (payerWallet.getId() < creatorWallet.getId()) {
            firstLock = walletRepository.findByWalletNumberWithLock(payerWallet.getWalletNumber())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payer wallet not found"));
            secondLock = walletRepository.findByWalletNumberWithLock(creatorWallet.getWalletNumber())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator wallet not found"));
        } else {
            firstLock = walletRepository.findByWalletNumberWithLock(creatorWallet.getWalletNumber())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator wallet not found"));
            secondLock = walletRepository.findByWalletNumberWithLock(payerWallet.getWalletNumber())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payer wallet not found"));
        }

        payerWallet = payerWallet.getId().equals(firstLock.getId()) ? firstLock : secondLock;
        creatorWallet = creatorWallet.getId().equals(firstLock.getId()) ? firstLock : secondLock;

        if (!"ACTIVE".equals(payerWallet.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payer wallet is not active");
        }
        if (!"ACTIVE".equals(creatorWallet.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Creator wallet is not active");
        }

        BigDecimal amount = member.getAmount();
        if (payerWallet.getUsdBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient USD balance to pay $" + amount);
        }

        // Debit payer, Credit creator
        payerWallet.setUsdBalance(payerWallet.getUsdBalance().subtract(amount));
        creatorWallet.setUsdBalance(creatorWallet.getUsdBalance().add(amount));
        walletRepository.save(payerWallet);
        walletRepository.save(creatorWallet);

        // Record Transaction
        Transaction tx = new Transaction();
        tx.setTransactionNo("SB" + System.currentTimeMillis() + (1000 + new Random().nextInt(9000)));
        tx.setSenderWallet(payerWallet);
        tx.setReceiverWallet(creatorWallet);
        tx.setAmount(amount);
        tx.setFee(BigDecimal.ZERO);
        tx.setTotalAmount(amount);
        tx.setCurrency("USD");
        tx.setStatus("SUCCESS");
        tx.setTransactionType("TRANSFER");
        tx.setNote("Split Bill: " + splitBill.getNote());
        Transaction savedTx = transactionRepository.save(tx);

        // Update member status
        member.setStatus("PAID");
        member.setPaidAt(LocalDateTime.now());
        member.setPaymentTransaction(savedTx);
        memberRepository.save(member);

        // Check if all members are paid
        List<SplitBillMember> allMembers = memberRepository.findBySplitBillId(splitBillId);
        boolean allPaid = allMembers.stream().allMatch(m -> "PAID".equals(m.getStatus()));

        User payerUser = member.getUser();

        if (allPaid) {
            splitBill.setStatus("COMPLETED");
            // Notify creator that split bill is completed
            Notification completedNotif = new Notification();
            completedNotif.setUser(creator);
            completedNotif.setTitle("Split Completed");
            completedNotif.setMessage("All friends have paid their share for " + splitBill.getNote());
            completedNotif.setType("SPLIT_BILL_COMPLETED");
            completedNotif.setReferenceId(splitBill.getId());
            completedNotif.setIsRead(false);
            notificationRepository.save(completedNotif);
        } else {
            splitBill.setStatus("PARTIALLY_PAID");
        }
        splitBillRepository.save(splitBill);

        // Notify creator of payment received
        Notification paymentNotif = new Notification();
        paymentNotif.setUser(creator);
        paymentNotif.setTitle("Payment Received");
        paymentNotif.setMessage(payerUser.getFullName() + " paid you $" + amount.setScale(2) + " for " + splitBill.getNote());
        paymentNotif.setType("SPLIT_BILL_PAYMENT_RECEIVED");
        paymentNotif.setReferenceId(splitBill.getId());
        paymentNotif.setIsRead(false);
        notificationRepository.save(paymentNotif);

        return mapToResponse(splitBill);
    }

    @Override
    public void sendReminders(Long creatorUserId, Long splitBillId) {
        SplitBill splitBill = splitBillRepository.findById(splitBillId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Split bill not found"));

        if (!splitBill.getCreator().getId().equals(creatorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the creator can send reminders");
        }

        if ("COMPLETED".equals(splitBill.getStatus()) || "CANCELLED".equals(splitBill.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot send reminders for completed or cancelled split bill");
        }

        List<SplitBillMember> pendingMembers = memberRepository.findBySplitBillId(splitBillId).stream()
                .filter(m -> "PENDING".equals(m.getStatus()) && !m.getUser().getId().equals(creatorUserId))
                .toList();

        for (SplitBillMember pending : pendingMembers) {
            Notification reminder = new Notification();
            reminder.setUser(pending.getUser());
            reminder.setTitle("Payment Reminder");
            reminder.setMessage("You still have a $" + pending.getAmount().setScale(2) + " Split Bill payment pending. Requested by " + splitBill.getCreator().getFullName());
            reminder.setType("SPLIT_BILL_REMINDER");
            reminder.setReferenceId(splitBill.getId());
            reminder.setIsRead(false);
            notificationRepository.save(reminder);
        }
    }

    private SplitBillResponse mapToResponse(SplitBill bill) {
        User creator = bill.getCreator();
        Map<String, Object> creatorMap = new LinkedHashMap<>();
        creatorMap.put("id", creator.getId());
        creatorMap.put("name", creator.getFullName());
        creatorMap.put("phoneNumber", creator.getPhoneNumber());
        creatorMap.put("avatar", creator.getProfileImage());

        List<SplitBillMember> membersList = bill.getMembers();
        if (membersList == null || membersList.isEmpty()) {
            membersList = memberRepository.findBySplitBillId(bill.getId());
        }

        BigDecimal creatorPaidAmount = bill.getTotalAmount();
        BigDecimal totalToCollect = BigDecimal.ZERO;
        BigDecimal collectedAmount = BigDecimal.ZERO;

        List<SplitBillMemberResponse> memberResponses = new ArrayList<>();
        for (SplitBillMember m : membersList) {
            boolean isCreator = m.getUser().getId().equals(creator.getId());
            if (!isCreator) {
                totalToCollect = totalToCollect.add(m.getAmount());
                if ("PAID".equals(m.getStatus())) {
                    collectedAmount = collectedAmount.add(m.getAmount());
                }
            }

            memberResponses.add(new SplitBillMemberResponse(
                    m.getId(),
                    m.getUser().getId(),
                    m.getUser().getFullName(),
                    m.getUser().getPhoneNumber(),
                    m.getUser().getEmail(),
                    m.getUser().getProfileImage(),
                    m.getAmount(),
                    m.getStatus(),
                    m.getPaidAt(),
                    isCreator
            ));
        }

        double progress = 0.0;
        if (totalToCollect.compareTo(BigDecimal.ZERO) > 0) {
            progress = collectedAmount.divide(totalToCollect, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
            if (progress > 100.0) progress = 100.0;
        } else if ("COMPLETED".equals(bill.getStatus())) {
            progress = 100.0;
        }

        return new SplitBillResponse(
                bill.getId(),
                creatorMap,
                bill.getTotalAmount(),
                bill.getNote(),
                bill.getSplitType(),
                bill.getStatus(),
                creatorPaidAmount,
                totalToCollect,
                collectedAmount,
                progress,
                memberResponses,
                bill.getCreatedAt(),
                bill.getUpdatedAt()
        );
    }
}
