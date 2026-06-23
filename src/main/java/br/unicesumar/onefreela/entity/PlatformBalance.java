package br.unicesumar.onefreela.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "platform_balance")
public class PlatformBalance {

    @Id
    private Long id = 1L;

    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal pendingBalance = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal availableBalance = BigDecimal.ZERO;

    public PlatformBalance() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getPendingBalance() { return pendingBalance; }
    public void setPendingBalance(BigDecimal pendingBalance) { this.pendingBalance = pendingBalance; }

    public BigDecimal getAvailableBalance() { return availableBalance; }
    public void setAvailableBalance(BigDecimal availableBalance) { this.availableBalance = availableBalance; }
}
