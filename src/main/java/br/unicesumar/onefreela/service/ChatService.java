package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.AttachmentDownload;
import br.unicesumar.onefreela.dto.ChatMessageDTO;
import br.unicesumar.onefreela.dto.DeliverDTO;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.MessageResponse;
import br.unicesumar.onefreela.entity.Conversation;
import br.unicesumar.onefreela.entity.Delivery;
import br.unicesumar.onefreela.entity.DeliveryFile;
import br.unicesumar.onefreela.entity.Message;
import br.unicesumar.onefreela.entity.MessageAttachment;
import br.unicesumar.onefreela.entity.Order;
import br.unicesumar.onefreela.entity.OrderItem;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.enums.MessageType;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.ConversationRepository;
import br.unicesumar.onefreela.repository.DeliveryFileRepository;
import br.unicesumar.onefreela.repository.MessageAttachmentRepository;
import br.unicesumar.onefreela.repository.MessageRepository;
import br.unicesumar.onefreela.service.validator.ChatValidator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AuthService authService;
    private final ChatValidator chatValidator;
    private final OrderService orderService;
    private final ChatFileStorageService chatFileStorageService;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final DeliveryFileRepository deliveryFileRepository;

    public ChatService(ConversationRepository conversationRepository, MessageRepository messageRepository, AuthService authService, ChatValidator chatValidator, OrderService orderService, ChatFileStorageService chatFileStorageService, MessageAttachmentRepository messageAttachmentRepository, DeliveryFileRepository deliveryFileRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.authService = authService;
        this.chatValidator = chatValidator;
        this.orderService = orderService;
        this.chatFileStorageService = chatFileStorageService;
        this.messageAttachmentRepository = messageAttachmentRepository;
        this.deliveryFileRepository = deliveryFileRepository;
    }

    private Conversation findConversationByOrderItem(Long orderItemId) {
        List<ErrorDetail> errors = new ArrayList<>();

        Conversation conversation = conversationRepository.findByOrderItemId(orderItemId).orElse(null);

        if (conversation == null) {
            errors.add(new ErrorDetail(ErrorCode.CONVERSATION_NOT_FOUND, "conversation", "conversa nao encontrada"));
            throw new ValidationException(errors);
        }

        return conversation;
    }

    private void validateParticipant(Conversation conversation, User authenticatedUser) {
        boolean isCustomer = conversation.getOrder().getUser().getId().equals(authenticatedUser.getId());
        boolean isFreelancer = conversation.getOrderItem().getWork().getOwner().getId().equals(authenticatedUser.getId());

        if (!isCustomer && !isFreelancer) {
            List<ErrorDetail> errors = new ArrayList<>();
            errors.add(new ErrorDetail(ErrorCode.CHAT_ACCESS_DENIED, "user", "voce nao participa desta conversa"));
            throw new ValidationException(errors);
        }
    }

    private void validateNotLocked(Conversation conversation) {
        if (conversation.isLocked()) {
            List<ErrorDetail> errors = new ArrayList<>();
            errors.add(new ErrorDetail(ErrorCode.CHAT_LOCKED, "conversation",
                    "Este chat foi encerrado e nao aceita novas mensagens"));
            throw new ValidationException(errors);
        }
    }

    private void lockConversation(Conversation conversation) {
        conversation.setLocked(true);
        conversationRepository.save(conversation);
    }

    private void addAttachments(Message message, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }

        for (MultipartFile file : files) {
            MessageAttachment attachment = new MessageAttachment();

            attachment.setMessage(message);
            attachment.setFileSize(file.getSize());
            attachment.setExtension(file.getContentType());
            attachment.setOriginalName(file.getOriginalFilename());
            attachment.setUploadedAt(LocalDate.now());
            attachment.setPath(chatFileStorageService.store(file));

            message.getAttachmentList().add(attachment);
        }
    }

    private MessageResponse createEventMessage(Conversation conversation, User user, MessageType type, String content) {
        Message message = new Message();

        message.setConversation(conversation);
        message.setSender(user);
        message.setType(type);
        message.setContent(content);
        message.setSentAt(LocalDateTime.now());

        messageRepository.save(message);

        return MessageResponse.fromEntity(message);
    }

    public Conversation createConversation(Order order, OrderItem orderItem) {
        return conversationRepository.findByOrderItemId(orderItem.getId()).orElseGet(() -> {
            Conversation conversation = new Conversation();
            conversation.setOrder(order);
            conversation.setOrderItem(orderItem);
            conversation.setCreatedAt(LocalDateTime.now());
            return conversationRepository.save(conversation);
        });
    }

    @Transactional
    public MessageResponse sendMessage(Long orderItemId, ChatMessageDTO dto, HttpServletRequest request) {
        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversationByOrderItem(orderItemId);

        validateParticipant(conversation, authenticatedUser);
        validateNotLocked(conversation);

        List<ErrorDetail> errors = chatValidator.validateMessage(dto.getContent(), dto.getFiles());

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        Message message = new Message();

        message.setConversation(conversation);
        message.setSender(authenticatedUser);
        message.setContent(dto.getContent());
        message.setSentAt(LocalDateTime.now());

        if (dto.getFiles() != null && !dto.getFiles().isEmpty()) {
            message.setType(MessageType.ATTACHMENT);
        } else {
            message.setType(MessageType.TEXT);
        }

        addAttachments(message, dto.getFiles());

        messageRepository.save(message);

        return MessageResponse.fromEntity(message);
    }

    public List<MessageResponse> getMessages(Long orderItemId, HttpServletRequest request) {
        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversationByOrderItem(orderItemId);

        validateParticipant(conversation, authenticatedUser);

        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversation.getId());

        return messages.stream().map(MessageResponse::fromEntity).toList();
    }

    @Transactional
    public MessageResponse makeDelivery(Long orderItemId, DeliverDTO dto, HttpServletRequest request) {
        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversationByOrderItem(orderItemId);

        validateParticipant(conversation, authenticatedUser);
        validateNotLocked(conversation);

        dto.setOrderItemId(orderItemId);

        Delivery delivery = orderService.makeDelivery(authenticatedUser, dto);

        Message message = new Message();

        message.setConversation(conversation);
        message.setSender(authenticatedUser);
        message.setContent(dto.getMessage());
        message.setType(MessageType.DELIVERY);
        message.setDelivery(delivery);
        message.setSentAt(LocalDateTime.now());

        messageRepository.save(message);

        return MessageResponse.fromEntity(message);
    }

    @Transactional
    public MessageResponse acceptDelivery(Long orderItemId, HttpServletRequest request) {
        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversationByOrderItem(orderItemId);

        validateParticipant(conversation, authenticatedUser);

        orderService.acceptDelivery(authenticatedUser, orderItemId);
        lockConversation(conversation);

        return createEventMessage(conversation, authenticatedUser, MessageType.DELIVERY_ACCEPTED, "Entrega aceita pelo cliente");
    }

    @Transactional
    public MessageResponse acceptDeliveryAfterFreeze(Long orderItemId, HttpServletRequest request) {
        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversationByOrderItem(orderItemId);

        validateParticipant(conversation, authenticatedUser);

        orderService.acceptFrozenDelivery(authenticatedUser, orderItemId);
        lockConversation(conversation);

        return createEventMessage(conversation, authenticatedUser, MessageType.DELIVERY_ACCEPTED_AFTER_FREEZE,
                "Entrega aceita pelo cliente apos recusa de ajuste");
    }

    @Transactional
    public MessageResponse refuseDelivery(Long orderItemId, String reason, HttpServletRequest request) {
        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversationByOrderItem(orderItemId);

        validateParticipant(conversation, authenticatedUser);

        orderService.refuseDelivery(authenticatedUser, orderItemId);

        String content = (reason != null && !reason.isBlank()) ? reason : "Entrega recusada pelo cliente";

        return createEventMessage(conversation, authenticatedUser, MessageType.DELIVERY_REFUSED, content);
    }

    @Transactional
    public MessageResponse acceptAdjustment(Long orderItemId, HttpServletRequest request) {
        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversationByOrderItem(orderItemId);

        validateParticipant(conversation, authenticatedUser);

        orderService.acceptAdjustmentRequest(authenticatedUser, orderItemId);

        return createEventMessage(conversation, authenticatedUser, MessageType.ADJUSTMENT_ACCEPTED, "Solicitacao de ajuste aceita pelo freelancer");
    }

    @Transactional
    public MessageResponse refuseAdjustment(Long orderItemId, HttpServletRequest request) {
        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversationByOrderItem(orderItemId);

        validateParticipant(conversation, authenticatedUser);

        orderService.refuseAdjustmentRequest(authenticatedUser, orderItemId);

        return createEventMessage(conversation, authenticatedUser, MessageType.ADJUSTMENT_REFUSED, "Solicitacao de ajuste recusada pelo freelancer");
    }

    @Transactional
    public MessageResponse openDispute(Long orderItemId, HttpServletRequest request) {
        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversationByOrderItem(orderItemId);

        validateParticipant(conversation, authenticatedUser);

        orderService.openDispute(authenticatedUser, orderItemId);

        OrderItem item = conversation.getOrderItem();
        String summary = String.format(
                "DISPUTA ABERTA — Pedido #%d | Servico: %s | Cliente: %s | Freelancer: %s | Tentativas de entrega: %d. "
                        + "Aguardando revisao do administrador.",
                item.getOrder().getId(),
                item.getWork().getTitle(),
                item.getOrder().getUser().getName(),
                item.getWork().getOwner().getName(),
                item.getDeliveryTries()
        );

        return createEventMessage(conversation, authenticatedUser, MessageType.DISPUTE_OPENED, summary);
    }

    public AttachmentDownload downloadAttachment(Long orderItemId, String source, Long attachmentId, HttpServletRequest request) {
        User authenticatedUser = authService.getAuthenticatedUser(request);
        Conversation conversation = findConversationByOrderItem(orderItemId);

        validateParticipant(conversation, authenticatedUser);

        List<ErrorDetail> errors = new ArrayList<>();
        String path;
        String originalName;
        String contentType;

        if ("DELIVERY".equalsIgnoreCase(source)) {
            DeliveryFile file = deliveryFileRepository.findById(attachmentId).orElse(null);

            if (file == null || file.getDelivery() == null || file.getDelivery().getOrderItem() == null
                    || !file.getDelivery().getOrderItem().getId().equals(orderItemId)) {
                errors.add(new ErrorDetail(ErrorCode.ATTACHMENT_NOT_FOUND, "attachment", "arquivo nao encontrado"));
                throw new ValidationException(errors);
            }

            path = file.getPath();
            originalName = file.getOriginalName();
            contentType = file.getExtension();
        } else {
            MessageAttachment attachment = messageAttachmentRepository.findById(attachmentId).orElse(null);

            if (attachment == null || attachment.getMessage() == null
                    || !attachment.getMessage().getConversation().getId().equals(conversation.getId())) {
                errors.add(new ErrorDetail(ErrorCode.ATTACHMENT_NOT_FOUND, "attachment", "arquivo nao encontrado"));
                throw new ValidationException(errors);
            }

            path = attachment.getPath();
            originalName = attachment.getOriginalName();
            contentType = attachment.getExtension();
        }

        try {
            Resource resource = new UrlResource(Path.of(path).toUri());

            if (!resource.exists() || !resource.isReadable()) {
                errors.add(new ErrorDetail(ErrorCode.ATTACHMENT_NOT_FOUND, "attachment", "arquivo nao encontrado no servidor"));
                throw new ValidationException(errors);
            }

            return new AttachmentDownload(resource, originalName, contentType);
        } catch (MalformedURLException e) {
            throw new RuntimeException("Erro ao acessar arquivo", e);
        }
    }
}