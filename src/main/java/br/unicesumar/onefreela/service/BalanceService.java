package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.entity.*;
import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.enums.TransactionType;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.FinancialTransactionRepository;
import br.unicesumar.onefreela.repository.PlatformBalanceRepository;
import br.unicesumar.onefreela.repository.UserBalanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BalanceService {

    private static final Long PLATFORM_BALANCE_ID = 1L;

    private final PlatformBalanceRepository platformBalanceRepository;
    private final UserBalanceRepository userBalanceRepository;
    private final FinancialTransactionRepository transactionRepository;

    public BalanceService(PlatformBalanceRepository platformBalanceRepository,
                          UserBalanceRepository userBalanceRepository,
                          FinancialTransactionRepository transactionRepository) {
        this.platformBalanceRepository = platformBalanceRepository;
        this.userBalanceRepository = userBalanceRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public PlatformBalance getPlatformBalance() {
        return platformBalanceRepository.findById(PLATFORM_BALANCE_ID)
                .orElseGet(() -> {
                    PlatformBalance balance = new PlatformBalance();
                    balance.setId(PLATFORM_BALANCE_ID);
                    return platformBalanceRepository.save(balance);
                });
    }

    @Transactional
    public UserBalance getUserBalance(User user) {
        return userBalanceRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserBalance balance = new UserBalance();
                    balance.setUser(user);
                    return userBalanceRepository.save(balance);
                });
    }

    @Transactional
    public void creditUser(User user, BigDecimal amount, TransactionType type, String description,
                           Order order, OrderItem orderItem) {
        UserBalance balance = getUserBalance(user);
        balance.setBalance(balance.getBalance().add(amount));
        userBalanceRepository.save(balance);
        recordTransaction(type, amount, description, order, orderItem, user);
    }

    @Transactional
    public void debitUser(User user, BigDecimal amount, TransactionType type, String description,
                          Order order, OrderItem orderItem) {
        UserBalance balance = getUserBalance(user);
        if (balance.getBalance().compareTo(amount) < 0) {
            throw new ValidationException(List.of(
                    new ErrorDetail(ErrorCode.INSUFFICIENT_BALANCE, "balance",
                            "Saldo insuficiente. Disponível: " + balance.getBalance())
            ));
        }
        balance.setBalance(balance.getBalance().subtract(amount));
        userBalanceRepository.save(balance);
        recordTransaction(type, amount, description, order, orderItem, user);
    }

    @Transactional
    public BigDecimal withdrawUser(User user) {
        UserBalance balance = getUserBalance(user);

        if (balance.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException(List.of(
                    new ErrorDetail(ErrorCode.NO_BALANCE_TO_WITHDRAW, "balance",
                            "Não há saldo disponível para resgatar")
            ));
        }

        BigDecimal withdrawnAmount = balance.getBalance();
        balance.setBalance(BigDecimal.ZERO);
        userBalanceRepository.save(balance);
        recordTransaction(TransactionType.WITHDRAWAL, withdrawnAmount,
                "Resgate de saldo", null, null, user);
        return withdrawnAmount;
    }

    @Transactional
    public void addToPlatformPending(BigDecimal amount, Order order) {
        PlatformBalance balance = getPlatformBalance();
        balance.setPendingBalance(balance.getPendingBalance().add(amount));
        platformBalanceRepository.save(balance);
        recordTransaction(TransactionType.ORDER_PAYMENT, amount,
                "Pagamento do pedido #" + order.getId() + " recebido no saldo pendente",
                order, null, order.getUser());
    }

    @Transactional
    public void releaseFromPlatformPending(BigDecimal totalItemAmount, BigDecimal platformFeeAmount,
                                           Order order, OrderItem orderItem) {
        PlatformBalance balance = getPlatformBalance();

        if (balance.getPendingBalance().compareTo(totalItemAmount) < 0) {
            throw new ValidationException(List.of(
                    new ErrorDetail(ErrorCode.INSUFFICIENT_BALANCE, "platformBalance",
                            "Saldo pendente da plataforma insuficiente")
            ));
        }

        balance.setPendingBalance(balance.getPendingBalance().subtract(totalItemAmount));
        balance.setAvailableBalance(balance.getAvailableBalance().add(platformFeeAmount));
        platformBalanceRepository.save(balance);

        recordTransaction(TransactionType.PLATFORM_PENDING_RELEASE, totalItemAmount,
                "Liberação do item #" + orderItem.getId() + " do saldo pendente",
                order, orderItem, null);
        recordTransaction(TransactionType.PLATFORM_FEE, platformFeeAmount,
                "Taxa da plataforma referente ao item #" + orderItem.getId(),
                order, orderItem, null);
    }

    @Transactional
    public void debitFromPlatformPending(BigDecimal amount, Order order, OrderItem orderItem) {
        PlatformBalance balance = getPlatformBalance();
        if (balance.getPendingBalance().compareTo(amount) < 0) {
            throw new ValidationException(List.of(
                    new ErrorDetail(ErrorCode.INSUFFICIENT_BALANCE, "platformBalance",
                            "Saldo pendente da plataforma insuficiente para reembolso")
            ));
        }
        balance.setPendingBalance(balance.getPendingBalance().subtract(amount));
        platformBalanceRepository.save(balance);
    }

    private void recordTransaction(TransactionType type, BigDecimal amount, String description,
                                   Order order, OrderItem orderItem, User relatedUser) {
        FinancialTransaction tx = new FinancialTransaction();
        tx.setType(type);
        tx.setAmount(amount);
        tx.setDescription(description);
        tx.setOrder(order);
        tx.setOrderItem(orderItem);
        tx.setRelatedUser(relatedUser);
        transactionRepository.save(tx);
    }
}
