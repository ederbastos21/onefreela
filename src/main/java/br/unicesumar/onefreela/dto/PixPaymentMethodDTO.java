package br.unicesumar.onefreela.dto;

import java.time.LocalDate;

public class PixPaymentMethodDTO {
    Long orderId;
    String cpf;

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }
}
