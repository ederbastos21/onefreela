package br.unicesumar.onefreela.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import br.unicesumar.onefreela.entity.CartItem;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long>{
    List<CartItem> findAllByUserId(Long id);
}
