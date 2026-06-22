package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.entity.OrderItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);
    List<OrderItem> findByFreelancerId(Long freelancerId);
    boolean existsByOrderIdAndStatusNotIn(Long orderId, List<OrderItemStatus> statuses);
}
