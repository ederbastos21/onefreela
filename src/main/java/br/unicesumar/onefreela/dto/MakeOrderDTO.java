package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.enums.PaymentMethod;

public class MakeOrderDTO {
    private PaymentMethod paymentMethod;

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
