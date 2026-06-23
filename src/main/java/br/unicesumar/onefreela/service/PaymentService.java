package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.CardPaymentMethodDTO;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.PixPaymentMethodDTO;
import br.unicesumar.onefreela.entity.*;
import br.unicesumar.onefreela.enums.*;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.PaymentRepository;
import jakarta.transaction.Transactional;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class PaymentService {

    private static final double PLATFORM_FEE_RATE = 0.15;

    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final ChatService chatService;
    private final BalanceService balanceService;

    public PaymentService(PaymentRepository paymentRepository,
                          @Lazy OrderService orderService,
                          ChatService chatService,
                          BalanceService balanceService) {
        this.paymentRepository = paymentRepository;
        this.orderService = orderService;
        this.chatService = chatService;
        this.balanceService = balanceService;
    }

    @Transactional
    public Payment makePayment(User user, Order order) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (!(order.getUser().getId().equals(user.getId()))) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "payment", "erro de permissao"));
            throw new ValidationException(errors);
        }

        Payment payment = new Payment();
        payment.setPaymentMethod(order.getPaymentMethod());
        payment.setStatus(PaymentStatus.PENDENT);
        payment.setValue(order.getTotalPrice());
        payment.setOrder(order);
        payment.setReleasedAt(null);
        payment.setPlatformFee(PLATFORM_FEE_RATE);

        return paymentRepository.save(payment);
    }

    private void confirmOrderPayment(Order order) {
        order.setStatus(OrderStatus.PAID);

        balanceService.addToPlatformPending(BigDecimal.valueOf(order.getTotalPrice()), order);

        for (OrderItem orderItem : order.getOrderItemlist()) {
            orderItem.setStatus(OrderItemStatus.PENDING_DELIVERY);
            chatService.createConversation(order, orderItem);
        }
        orderService.saveOrder(order);
    }

    @Transactional
    public Payment processPaymentCard(Payment payment, CardPaymentMethodDTO cardPaymentMethodDTO) {
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDate.now());
        confirmOrderPayment(payment.getOrder());
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment processPaymentPix(Payment payment, PixPaymentMethodDTO pixPaymentMethodDTO) {
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDate.now());
        confirmOrderPayment(payment.getOrder());
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment processPaymentBalance(User user, Order order) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (!(order.getUser().getId().equals(user.getId()))) {
            errors.add(new ErrorDetail(ErrorCode.ACCESS_DENIED, "payment", "erro de permissao"));
            throw new ValidationException(errors);
        }

        BigDecimal totalAmount = BigDecimal.valueOf(order.getTotalPrice());
        balanceService.debitUser(user, totalAmount, TransactionType.ORDER_PAYMENT,
                "Pagamento do pedido #" + order.getId() + " via saldo", order, null);

        Payment payment = new Payment();
        payment.setPaymentMethod(PaymentMethod.BALANCE);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setValue(order.getTotalPrice());
        payment.setPlatformFee(PLATFORM_FEE_RATE);
        payment.setOrder(order);
        payment.setPaidAt(LocalDate.now());
        Payment savedPayment = paymentRepository.save(payment);

        confirmOrderPayment(order);

        return savedPayment;
    }

    @Transactional
    public void distributeOrderItemFunds(OrderItem item) {
        double itemTotal = item.getTotalPrice();
        double feeAmount = round(itemTotal * PLATFORM_FEE_RATE);
        double freelancerAmount = round(itemTotal - feeAmount);

        balanceService.releaseFromPlatformPending(
                BigDecimal.valueOf(itemTotal),
                BigDecimal.valueOf(feeAmount),
                item.getOrder(), item);

        balanceService.creditUser(
                item.getWork().getOwner(),
                BigDecimal.valueOf(freelancerAmount),
                TransactionType.FREELANCER_CREDIT,
                "Pagamento pelo servico '" + item.getWork().getTitle() + "' (pedido #" + item.getOrder().getId() + ")",
                item.getOrder(), item);

        Payment payment = item.getOrder().getPayment();
        if (payment != null) {
            payment.setReleasedAt(LocalDate.now());
            payment.setFreelancerValue(freelancerAmount);
            paymentRepository.save(payment);
        }
    }

    @Transactional
    public void refundOrderItem(OrderItem item) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (item.getStatus() == OrderItemStatus.COMPLETED) {
            errors.add(new ErrorDetail(ErrorCode.ORDER_ITEM_ALREADY_COMPLETED, "orderItem",
                    "Item ja concluido nao pode ser reembolsado"));
            throw new ValidationException(errors);
        }

        User client = item.getOrder().getUser();
        balanceService.debitFromPlatformPending(BigDecimal.valueOf(item.getTotalPrice()), item.getOrder(), item);
        balanceService.creditUser(client, BigDecimal.valueOf(item.getTotalPrice()),
                TransactionType.CLIENT_REFUND,
                "Reembolso do item '" + item.getWork().getTitle() + "' (pedido #" + item.getOrder().getId() + ")",
                item.getOrder(), item);
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
