package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.Message;
import java.time.LocalDateTime;

public class MessageResponse {

    private Long id;
    private Long senderId;
    private String senderName;
    private String content;
    private LocalDateTime sentAt;

    public static MessageResponse fromEntity(Message message) {

        MessageResponse response = new MessageResponse();
        
        response.id = message.getId();
        response.senderId = message.getSender().getId();
        response.senderName = message.getSender().getName();
        response.content = message.getContent();
        response.sentAt = message.getSentAt();

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

    public LocalDateTime getSentAt() {
        return sentAt;
    }
}