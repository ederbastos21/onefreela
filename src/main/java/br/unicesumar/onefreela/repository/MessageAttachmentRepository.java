package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {
}