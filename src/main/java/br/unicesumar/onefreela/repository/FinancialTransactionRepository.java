package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long> {
    List<FinancialTransaction> findByOrderId(Long orderId);
    List<FinancialTransaction> findByRelatedUserId(Long userId);
}
