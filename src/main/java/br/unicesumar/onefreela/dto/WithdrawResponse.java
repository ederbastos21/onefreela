package br.unicesumar.onefreela.dto;

import java.math.BigDecimal;

public class WithdrawResponse {

    private BigDecimal withdrawnAmount;
    private BigDecimal newBalance;

    public WithdrawResponse(BigDecimal withdrawnAmount, BigDecimal newBalance) {
        this.withdrawnAmount = withdrawnAmount;
        this.newBalance = newBalance;
    }

    public BigDecimal getWithdrawnAmount() {
        return withdrawnAmount;
    }

    public BigDecimal getNewBalance() {
        return newBalance;
    }

    public WithdrawResponse() {}
}
