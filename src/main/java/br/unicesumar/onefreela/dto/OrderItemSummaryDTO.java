package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.enums.OrderItemStatus;

public class OrderItemSummaryDTO {

    private Long id;
    private String workTitle;
    private String freelancerName;
    private OrderItemStatus status;
    private double unitPrice;
    private double totalPrice;
    private int amount;

    public static OrderItemSummaryDTO fromEntity(OrderItem item) {
        OrderItemSummaryDTO dto = new OrderItemSummaryDTO();
        dto.id         = item.getId();
        dto.status     = item.getStatus();
        dto.unitPrice  = item.getUnitPrice();
        dto.totalPrice = item.getTotalPrice();
        dto.amount     = item.getAmount();
        if (item.getWork() != null) {
            dto.workTitle      = item.getWork().getTitle();
            if (item.getWork().getOwner() != null) {
                dto.freelancerName = item.getWork().getOwner().getName();
            }
        }
        return dto;
    }

    public Long getId()             { return id; }
    public String getWorkTitle()    { return workTitle; }
    public String getFreelancerName() { return freelancerName; }
    public OrderItemStatus getStatus() { return status; }
    public double getUnitPrice()    { return unitPrice; }
    public double getTotalPrice()   { return totalPrice; }
    public int getAmount()          { return amount; }
}
