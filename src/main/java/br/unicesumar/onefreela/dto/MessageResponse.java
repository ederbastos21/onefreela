package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.Message;
import br.unicesumar.onefreela.enums.MessageType;
import java.time.LocalDateTime;
import java.util.List;

public class MessageResponse {

    private Long id;
    private Long senderId;
    private String senderName;
    private String content;
    private MessageType type;
    private Long deliveryId;
    private Long orderItemId;
    private LocalDateTime sentAt;
    private List<MessageAttachmentResponse> attachments;

    public static MessageResponse fromEntity(Message message) {
        MessageResponse response = new MessageResponse();

        response.id = message.getId();
        response.senderId = message.getSender().getId();
        response.senderName = message.getSender().getName();
        response.content = message.getContent();
        response.type = message.getType();
        response.sentAt = message.getSentAt();

        if (message.getDelivery() != null) {
            response.deliveryId = message.getDelivery().getId();
        }

        if (message.getConversation() != null && message.getConversation().getOrderItem() != null) {
            response.orderItemId = message.getConversation().getOrderItem().getId();
        }

        response.attachments = message.getAttachmentList()
                .stream()
                .map(MessageAttachmentResponse::fromEntity)
                .toList();

        return response;
    }

    public Long getId() {
        return id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public String getContent() {
        return content;
    }

    public MessageType getType() {
        return type;
    }

    public Long getDeliveryId() {
        return deliveryId;
    }

    public Long getOrderItemId() {
        return orderItemId;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public List<MessageAttachmentResponse> getAttachments() {
        return attachments;
    }
}