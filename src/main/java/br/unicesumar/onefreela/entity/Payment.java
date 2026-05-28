package br.unicesumar.onefreela.entity;

import br.unicesumar.onefreela.enums.PaymentMethod;
import br.unicesumar.onefreela.enums.PaymentStatus;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    Order order;

    Double value;

    PaymentStatus status;
    PaymentMethod paymentMethod;
    LocalDate paidAt;
    LocalDate releasedAt;
    Double platformFee;
    Double freelancerValue;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public LocalDate getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDate paidAt) {
        this.paidAt = paidAt;
    }

    public LocalDate getReleasedAt() {
        return releasedAt;
    }

    public void setReleasedAt(LocalDate releasedAt) {
        this.releasedAt = releasedAt;
    }

    public Double getPlatformFee() {
        return platformFee;
    }

    public void setPlatformFee(Double platformFee) {
        this.platformFee = platformFee;
    }

    public Double getFreelancerValue() {
        return freelancerValue;
    }

    public void setFreelancerValue(Double freelancerValue) {
        this.freelancerValue = freelancerValue;
    }
}
