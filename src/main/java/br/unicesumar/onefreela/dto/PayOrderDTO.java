package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public class PayOrderDTO {

    @NotNull(message = "Método de pagamento é obrigatório")
    private PaymentMethod paymentMethod;

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
}
