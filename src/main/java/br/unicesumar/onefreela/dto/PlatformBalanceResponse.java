package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.PlatformBalance;
import java.math.BigDecimal;

public class PlatformBalanceResponse {

    private BigDecimal pendingBalance;
    private BigDecimal availableBalance;

    public static PlatformBalanceResponse fromEntity(PlatformBalance platformBalance) {
        PlatformBalanceResponse response = new PlatformBalanceResponse();
        response.pendingBalance = platformBalance.getPendingBalance();
        response.availableBalance = platformBalance.getAvailableBalance();
        return response;
    }

    public BigDecimal getPendingBalance() {
        return pendingBalance;
    }

    public BigDecimal getAvailableBalance() {
        return availableBalance;
    }

    public PlatformBalanceResponse() {}
}
