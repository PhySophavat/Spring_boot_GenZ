package com.ewallet.billsplit;

import com.ewallet.billsplit.dto.CreateSplitBillRequest;
import com.ewallet.billsplit.dto.SplitBillResponse;
import com.ewallet.billsplit.entity.SplitBill;
import com.ewallet.billsplit.entity.SplitBillMember;
import com.ewallet.billsplit.repository.SplitBillMemberRepository;
import com.ewallet.billsplit.repository.SplitBillRepository;
import com.ewallet.billsplit.service.SplitBillServiceImpl;
import com.ewallet.notification.repository.NotificationRepository;
import com.ewallet.transaction.repository.TransactionRepository;
import com.ewallet.user.entity.User;
import com.ewallet.user.repository.UserRepository;
import com.ewallet.wallet.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class SplitBillServiceTest {

    private SplitBillRepository splitBillRepository;
    private SplitBillMemberRepository memberRepository;
    private UserRepository userRepository;
    private WalletRepository walletRepository;
    private TransactionRepository transactionRepository;
    private NotificationRepository notificationRepository;
    private SplitBillServiceImpl service;

    @BeforeEach
    void setUp() {
        splitBillRepository = Mockito.mock(SplitBillRepository.class);
        memberRepository = Mockito.mock(SplitBillMemberRepository.class);
        userRepository = Mockito.mock(UserRepository.class);
        walletRepository = Mockito.mock(WalletRepository.class);
        transactionRepository = Mockito.mock(TransactionRepository.class);
        notificationRepository = Mockito.mock(NotificationRepository.class);

        service = new SplitBillServiceImpl(
                splitBillRepository,
                memberRepository,
                userRepository,
                walletRepository,
                transactionRepository,
                notificationRepository
        );
    }

    @Test
    void testCreateEqualSplitBill() {
        User creator = new User();
        creator.setId(1L);
        creator.setFullName("Sophavat");
        creator.setPhoneNumber("012345678");

        User friend1 = new User();
        friend1.setId(2L);
        friend1.setFullName("Dara");
        friend1.setPhoneNumber("012888001");

        User friend2 = new User();
        friend2.setId(3L);
        friend2.setFullName("Sopheak");
        friend2.setPhoneNumber("012888002");

        when(userRepository.findById(1L)).thenReturn(Optional.of(creator));
        when(userRepository.findAllById(any())).thenReturn(List.of(friend1, friend2));
        when(splitBillRepository.save(any(SplitBill.class))).thenAnswer(inv -> {
            SplitBill sb = inv.getArgument(0);
            return sb;
        });

        CreateSplitBillRequest req = new CreateSplitBillRequest();
        req.setTotalAmount(new BigDecimal("21.00"));
        req.setNote("Lunch");
        req.setSplitType("EQUAL");
        req.setFriendIds(List.of(2L, 3L));

        SplitBillResponse res = service.createSplitBill(1L, req);

        assertNotNull(res);
        assertEquals(new BigDecimal("21.00"), res.totalAmount());
        assertEquals("PENDING", res.status());
        assertEquals(3, res.members().size());

        // 21 / 3 = 7.00 per person
        for (var m : res.members()) {
            assertEquals(new BigDecimal("7.00"), m.amount());
        }
    }

    @Test
    void testCreateSplitWithYourselfFails() {
        CreateSplitBillRequest req = new CreateSplitBillRequest();
        req.setTotalAmount(new BigDecimal("20.00"));
        req.setFriendIds(List.of(1L)); // same as creator

        assertThrows(ResponseStatusException.class, () -> service.createSplitBill(1L, req));
    }

    @Test
    void testCreateSplitWithZeroAmountFails() {
        CreateSplitBillRequest req = new CreateSplitBillRequest();
        req.setTotalAmount(BigDecimal.ZERO);
        req.setFriendIds(List.of(2L));

        assertThrows(ResponseStatusException.class, () -> service.createSplitBill(1L, req));
    }
}
