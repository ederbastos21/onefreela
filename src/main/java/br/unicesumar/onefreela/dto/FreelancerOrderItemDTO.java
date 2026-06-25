package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.enums.OrderItemStatus;

import java.time.LocalDate;

public class FreelancerOrderItemDTO {

    private Long id;
    private String workTitle;
    private String clientName;
    private OrderItemStatus status;
    private double totalPrice;
    private LocalDate createdAt;
    private LocalDate deadlineDate;
    private int deliveryTries;
    private int amount;

    public static FreelancerOrderItemDTO fromEntity(OrderItem item) {
        FreelancerOrderItemDTO dto = new FreelancerOrderItemDTO();
        dto.id            = item.getId();
        dto.status        = item.getStatus();
        dto.totalPrice    = item.getTotalPrice();
        dto.createdAt     = item.getCreatedAt();
        dto.deadlineDate  = item.getDeadlineDate();
        dto.deliveryTries = item.getDeliveryTries();
        dto.amount        = item.getAmount();
        if (item.getWork() != null) {
            dto.workTitle = item.getWork().getTitle();
        }
        if (item.getOrder() != null && item.getOrder().getUser() != null) {
            dto.clientName = item.getOrder().getUser().getName();
        }
        return dto;
    }

    public Long getId()              { return id; }
    public String getWorkTitle()     { return workTitle; }
    public String getClientName()    { return clientName; }
    public OrderItemStatus getStatus() { return status; }
    public double getTotalPrice()    { return totalPrice; }
    public LocalDate getCreatedAt()  { return createdAt; }
    public LocalDate getDeadlineDate() { return deadlineDate; }
    public int getDeliveryTries()    { return deliveryTries; }
    public int getAmount()           { return amount; }
}
