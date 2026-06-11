package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.*;
import br.unicesumar.onefreela.entity.*;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.ConversationRepository;
import br.unicesumar.onefreela.repository.MessageRepository;
import br.unicesumar.onefreela.service.validator.ChatValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AuthService authService;
    private final ChatValidator chatValidator;

    public ChatService(ConversationRepository conversationRepository, MessageRepository messageRepository, AuthService authService, ChatValidator chatValidator) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.authService = authService;
        this.chatValidator = chatValidator;
    }

    private Conversation findConversation(Long orderId) {

        List<ErrorDetail> errors = new ArrayList<>();

        Conversation conversation = conversationRepository.findByOrderId(orderId).orElse(null);

        if (conversation == null) {
            errors.add(new ErrorDetail(ErrorCode.CONVERSATION_NOT_FOUND, "conversation", "conversa nao encontrada"));
            throw new ValidationException(errors);
        }
        return conversation;
    }

    private void validateParticipant(Order order, User authenticatedUser) {

        boolean isCustomer = order.getUser().getId().equals(authenticatedUser.getId());
        boolean isFreelancer = false;

        if (order.getOrderItemlist() != null) {
            for (OrderItem item : order.getOrderItemlist()) {
                if (item.getWork() != null && item.getWork().getOwner() != null && item.getWork().getOwner().getId().equals(authenticatedUser.getId())) {
                    isFreelancer = true;
                    break;
                }
            }
        }

        if (!isCustomer && !isFreelancer) {

            List<ErrorDetail> errors = new ArrayList<>();

            errors.add(new ErrorDetail(ErrorCode.CHAT_ACCESS_DENIED, "user", "voce nao participa desta conversa"));
            throw new ValidationException(errors);
        }
    }

    public MessageResponse sendMessage(Long orderId, MessageSendDTO dto, HttpServletRequest request) {

        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversation(orderId);
        validateParticipant(conversation.getOrder(), authenticatedUser);

        List<ErrorDetail> errors = chatValidator.validateMessage(dto.getContent());

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        Message message = new Message();

        message.setConversation(conversation);
        message.setSender(authenticatedUser);
        message.setContent(dto.getContent());
        message.setSentAt(LocalDateTime.now());

        messageRepository.save(message);

        return MessageResponse.fromEntity(message);
    }

    public List<MessageResponse> getMessages(Long orderId, HttpServletRequest request) {

        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversation(orderId);
        validateParticipant(conversation.getOrder(), authenticatedUser);
        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversation.getId());

        return messages.stream().map(MessageResponse::fromEntity).toList();
    }

    // temporary - til delivery be done
    public Conversation createConversation(Order order) {
    
        Conversation conversation = new Conversation();
        conversation.setOrder(order);
        conversation.setCreatedAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }
}