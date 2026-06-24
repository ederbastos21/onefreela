package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.Order;
import br.unicesumar.onefreela.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);
}
