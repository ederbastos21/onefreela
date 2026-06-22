package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.entity.OrderItemStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OrderItemResponse {

    private Long id;
    private Long workId;
    private String workTitle;
    private Long freelancerId;
    private String freelancerName;
    private BigDecimal price;
    private OrderItemStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderItemResponse fromEntity(OrderItem item) {
        OrderItemResponse r = new OrderItemResponse();
        r.id = item.getId();
        r.workId = item.getWork().getId();
        r.workTitle = item.getWork().getTitle();
        r.freelancerId = item.getFreelancer().getId();
        r.freelancerName = item.getFreelancer().getName();
        r.price = item.getPrice();
        r.status = item.getStatus();
        r.createdAt = item.getCreatedAt();
        r.updatedAt = item.getUpdatedAt();
        return r;
    }

    public Long getId() { return id; }
    public Long getWorkId() { return workId; }
    public String getWorkTitle() { return workTitle; }
    public Long getFreelancerId() { return freelancerId; }
    public String getFreelancerName() { return freelancerName; }
    public BigDecimal getPrice() { return price; }
    public OrderItemStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
