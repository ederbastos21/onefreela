package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.MessageResponse;
import br.unicesumar.onefreela.entity.*;
import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.enums.MessageType;
import br.unicesumar.onefreela.enums.OrderItemStatus;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.ConversationRepository;
import br.unicesumar.onefreela.repository.MessageRepository;
import br.unicesumar.onefreela.repository.OrderItemRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DisputeService {

    private final OrderItemRepository orderItemRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final PaymentService paymentService;

    public DisputeService(OrderItemRepository orderItemRepository,
                          ConversationRepository conversationRepository,
                          MessageRepository messageRepository,
                          PaymentService paymentService) {
        this.orderItemRepository = orderItemRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.paymentService = paymentService;
    }

    public List<OrderItem> getAllDisputedItems() {
        return orderItemRepository.findByStatus(OrderItemStatus.ON_DISPUTE);
    }

    public Conversation getDisputeConversation(Long orderItemId) {
        return findConversationOrThrow(orderItemId);
    }

    public List<Message> getDisputeMessages(Long orderItemId) {
        Conversation conversation = findConversationOrThrow(orderItemId);
        return messageRepository.findByConversationIdOrderBySentAtAsc(conversation.getId());
    }

    @Transactional
    public MessageResponse resolveForFreelancer(User admin, Long orderItemId) {
        OrderItem item = findDisputedItemOrThrow(orderItemId);

        item.setStatus(OrderItemStatus.COMPLETED);
        OrderItem saved = orderItemRepository.save(item);
        paymentService.distributeOrderItemFunds(saved);

        Conversation conversation = findConversationOrThrow(orderItemId);
        lockConversation(conversation);

        String content = "Disputa resolvida pelo administrador em favor do freelancer. "
                + "Entrega aceita e valores liberados para " + item.getWork().getOwner().getName() + ".";

        return postSystemMessage(conversation, admin, MessageType.DISPUTE_RESOLVED_FREELANCER, content);
    }

    @Transactional
    public MessageResponse resolveForClient(User admin, Long orderItemId) {
        OrderItem item = findDisputedItemOrThrow(orderItemId);

        paymentService.refundOrderItem(item);
        item.setStatus(OrderItemStatus.REFUNDED);
        orderItemRepository.save(item);

        Conversation conversation = findConversationOrThrow(orderItemId);
        lockConversation(conversation);

        String content = "Disputa resolvida pelo administrador em favor do cliente. "
                + "Valor de R$ " + String.format("%.2f", item.getTotalPrice())
                + " reembolsado para " + item.getOrder().getUser().getName() + ".";

        return postSystemMessage(conversation, admin, MessageType.DISPUTE_RESOLVED_CLIENT, content);
    }

    private OrderItem findDisputedItemOrThrow(Long orderItemId) {
        List<ErrorDetail> errors = new ArrayList<>();

        OrderItem item = orderItemRepository.findById(orderItemId).orElse(null);
        if (item == null) {
            errors.add(new ErrorDetail(ErrorCode.ORDER_ITEM_NOT_FOUND, "orderItem", "Item nao encontrado"));
            throw new ValidationException(errors);
        }

        if (item.getStatus() != OrderItemStatus.ON_DISPUTE) {
            errors.add(new ErrorDetail(ErrorCode.INVALID_DISPUTE_STATUS, "orderItem",
                    "Este item nao esta em disputa"));
            throw new ValidationException(errors);
        }

        return item;
    }

    private Conversation findConversationOrThrow(Long orderItemId) {
        List<ErrorDetail> errors = new ArrayList<>();

        Conversation conversation = conversationRepository.findByOrderItemId(orderItemId).orElse(null);
        if (conversation == null) {
            errors.add(new ErrorDetail(ErrorCode.CONVERSATION_NOT_FOUND, "conversation", "Conversa nao encontrada para este item"));
            throw new ValidationException(errors);
        }

        return conversation;
    }

    private void lockConversation(Conversation conversation) {
        conversation.setLocked(true);
        conversationRepository.save(conversation);
    }

    private MessageResponse postSystemMessage(Conversation conversation, User sender,
                                              MessageType type, String content) {
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setType(type);
        message.setContent(content);
        message.setSentAt(LocalDateTime.now());
        messageRepository.save(message);
        return MessageResponse.fromEntity(message);
    }
}
