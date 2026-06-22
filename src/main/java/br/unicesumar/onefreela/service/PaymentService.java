package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.entity.*;
import br.unicesumar.onefreela.exception.ValidationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PaymentService {

    private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.15");

    private final BalanceService balanceService;

    public PaymentService(BalanceService balanceService) {
        this.balanceService = balanceService;
    }

    /**
     * Processa o pagamento de um pedido pelo método escolhido.
     * O valor total vai para o saldo pendente da plataforma.
     */
    @Transactional
    public void processPayment(Order order, PaymentMethod method) {
        switch (method) {
            case BALANCE -> processBalancePayment(order);
            case CARD, PIX -> processExternalPayment(order, method);
        }
        balanceService.addToPlatformPending(order.getTotalAmount(), order);
    }

    /**
     * Distribui o valor de um item concluído:
     * - retira do saldo pendente da plataforma
     * - taxa vai para o saldo disponível da plataforma
     * - restante vai para o saldo do freelancer
     */
    @Transactional
    public void distributeOrderItemFunds(OrderItem item) {
        BigDecimal itemAmount = item.getPrice();
        BigDecimal platformFee = itemAmount.multiply(PLATFORM_FEE_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal freelancerAmount = itemAmount.subtract(platformFee);

        balanceService.releaseFromPlatformPending(itemAmount, platformFee, item.getOrder(), item);

        balanceService.creditUser(
                item.getFreelancer(),
                freelancerAmount,
                TransactionType.FREELANCER_CREDIT,
                "Pagamento pelo serviço '" + item.getWork().getTitle() + "' (pedido #" + item.getOrder().getId() + ")",
                item.getOrder(),
                item
        );
    }

    /**
     * Reembolsa o valor de um item para o cliente.
     * Válido apenas se o item ainda não foi concluído (dinheiro ainda está no pendente da plataforma).
     */
    @Transactional
    public void refundOrderItem(OrderItem item) {
        if (item.getStatus() == OrderItemStatus.COMPLETED) {
            throw new ValidationException(List.of(
                    new ErrorDetail(ErrorCode.ORDER_ITEM_ALREADY_COMPLETED, "orderItem",
                            "Item já concluído não pode ser reembolsado")
            ));
        }
        if (item.getStatus() == OrderItemStatus.REFUNDED) {
            throw new ValidationException(List.of(
                    new ErrorDetail(ErrorCode.ORDER_ALREADY_REFUNDED, "orderItem",
                            "Item já foi reembolsado")
            ));
        }

        balanceService.debitFromPlatformPending(item.getPrice(), item.getOrder(), item);
        balanceService.creditUser(
                item.getOrder().getClient(),
                item.getPrice(),
                TransactionType.CLIENT_REFUND,
                "Reembolso do item '" + item.getWork().getTitle() + "' (pedido #" + item.getOrder().getId() + ")",
                item.getOrder(),
                item
        );
    }

    private void processBalancePayment(Order order) {
        balanceService.debitUser(
                order.getClient(),
                order.getTotalAmount(),
                TransactionType.ORDER_PAYMENT,
                "Pagamento do pedido #" + order.getId() + " via saldo",
                order,
                null
        );
    }

    private void processExternalPayment(Order order, PaymentMethod method) {
        // Integração com gateway externo (Stripe, Pagar.me, etc.) seria feita aqui.
        // Por ora, o pagamento externo é simulado como sempre aprovado.
        System.out.println("[PAYMENT] Processando pagamento externo via " + method
                + " para o pedido #" + order.getId()
                + " no valor de R$ " + order.getTotalAmount());
    }
}
