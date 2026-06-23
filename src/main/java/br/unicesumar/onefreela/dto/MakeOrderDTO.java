package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.enums.PaymentMethod;

import java.util.List;
import java.util.Map;

public class MakeOrderDTO {

    private List<Long> cartItemIds;
    private Map<Long, List<Long>> additionalsByCartItem;
    private PaymentMethod paymentMethod;

    public List<Long> getCartItemIds() {
        return cartItemIds;
    }

    public void setCartItemIds(List<Long> cartItemIds) {
        this.cartItemIds = cartItemIds;
    }

    public Map<Long, List<Long>> getAdditionalsByCartItem() {
        return additionalsByCartItem;
    }

    public void setAdditionalsByCartItem(Map<Long, List<Long>> additionalsByCartItem) {
        this.additionalsByCartItem = additionalsByCartItem;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
