package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.Order;
import br.unicesumar.onefreela.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
