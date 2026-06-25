package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.Order;
import br.unicesumar.onefreela.enums.OrderStatus;
import br.unicesumar.onefreela.enums.PaymentMethod;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

public class UserOrderDTO {

    private Long id;
    private LocalDate createdAt;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private double totalPrice;
    private List<OrderItemSummaryDTO> items;

    public static UserOrderDTO fromEntity(Order order) {
        UserOrderDTO dto  = new UserOrderDTO();
        dto.id            = order.getId();
        dto.createdAt     = order.getCreatedAt();
        dto.status        = order.getStatus();
        dto.paymentMethod = order.getPaymentMethod();
        dto.totalPrice    = order.getTotalPrice() != null ? order.getTotalPrice() : 0;
        dto.items         = order.getOrderItemlist() != null
            ? order.getOrderItemlist().stream().map(OrderItemSummaryDTO::fromEntity).collect(Collectors.toList())
            : List.of();
        return dto;
    }

    public Long getId()                   { return id; }
    public LocalDate getCreatedAt()       { return createdAt; }
    public OrderStatus getStatus()        { return status; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public double getTotalPrice()         { return totalPrice; }
    public List<OrderItemSummaryDTO> getItems() { return items; }
}
