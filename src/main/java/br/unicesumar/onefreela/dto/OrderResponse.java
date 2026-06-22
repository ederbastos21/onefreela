package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.Order;
import br.unicesumar.onefreela.entity.OrderStatus;
import br.unicesumar.onefreela.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponse {

    private Long id;
    private Long clientId;
    private String clientName;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderResponse fromEntity(Order order) {
        OrderResponse r = new OrderResponse();
        r.id = order.getId();
        r.clientId = order.getClient().getId();
        r.clientName = order.getClient().getName();
        r.totalAmount = order.getTotalAmount();
        r.status = order.getStatus();
        r.paymentMethod = order.getPaymentMethod();
        r.items = order.getItems().stream().map(OrderItemResponse::fromEntity).toList();
        r.createdAt = order.getCreatedAt();
        r.updatedAt = order.getUpdatedAt();
        return r;
    }

    public Long getId() { return id; }
    public Long getClientId() { return clientId; }
    public String getClientName() { return clientName; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public OrderStatus getStatus() { return status; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public List<OrderItemResponse> getItems() { return items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
