package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.enums.OrderItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByWorkOwnerAndStatus(User owner, OrderItemStatus status);
}
