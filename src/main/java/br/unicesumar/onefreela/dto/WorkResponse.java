package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.entity.WorkStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class WorkResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private BigDecimal price;
    private WorkStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long ownerId;
    private String ownerName;

    public static WorkResponse fromEntity(Work w){
        WorkResponse r = new WorkResponse();
        r.id = w.getId();
        r.title = w.getTitle();
        r.description = w.getDescription();
        r.category = w.getCategory();
        r.price = w.getPrice();
        r.status = w.getStatus();
        r.createdAt = w.getCreatedAt();
        r.updatedAt = w.getUpdatedAt();
        if (w.getOwner() != null){
            r.ownerId = w.getOwner().getId();
            r.ownerName = w.getOwner().getName();
        }
        return r;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public WorkStatus getStatus() {
        return status;
    }

    public void setStatus(WorkStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public WorkResponse() {}
}