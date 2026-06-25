package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.UserBalance;
import java.math.BigDecimal;

public class UserBalanceResponse {

    private BigDecimal balance;

    public static UserBalanceResponse fromEntity(UserBalance userBalance) {
        UserBalanceResponse response = new UserBalanceResponse();
        response.balance = userBalance.getBalance();
        return response;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public UserBalanceResponse() {}
}
