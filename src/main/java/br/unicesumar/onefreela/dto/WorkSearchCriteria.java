package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.WorkStatus;

import java.math.BigDecimal;

public class WorkSearchCriteria {

    private String q;
    private String category;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Long ownerId;
    private WorkStatus status;

    public String getQ() {
        return q;
    }

    public void setQ(String q) {
        this.q = q;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(BigDecimal minPrice) {
        this.minPrice = minPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }

    public void setMaxPrice(BigDecimal maxPrice) {
        this.maxPrice = maxPrice;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public WorkStatus getStatus() {
        return status;
    }

    public void setStatus(WorkStatus status) {
        this.status = status;
    }

    public WorkSearchCriteria() {}
}