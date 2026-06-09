package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @Query("""
    SELECT oi 
    FROM OrderItem oi
    WHERE oi.work.owner.id = :freelancerId
      AND oi.deliveredAt IS NULL
""")
    List<OrderItem> findPendingDeliveries(Long freelancerId);

    @Query("""
    SELECT oi 
    FROM OrderItem oi
    WHERE oi.work.owner.id = :freelancerId
      AND oi.deliveredAt IS NOT NULL
""")
    List<OrderItem> findDeliveries(Long freelancerId);
}
