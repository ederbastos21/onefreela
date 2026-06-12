package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByOrderId(Long orderId);
}