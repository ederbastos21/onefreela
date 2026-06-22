package br.unicesumar.onefreela.entity;

import br.unicesumar.onefreela.enums.MessageType;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "message")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(length = 5000)
    private String content;

    @Enumerated(EnumType.STRING)
    private MessageType type;

    @OneToOne
    private Delivery delivery;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageAttachment> attachmentList = new ArrayList<>();

    private LocalDateTime sentAt;

    public Long getId() {
        return id;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public User getSender() {
        return sender;
    }

    public String getContent() {
        return content;
    }

    public MessageType getType() {
        return type;
    }

    public Delivery getDelivery() {
        return delivery;
    }

    public List<MessageAttachment> getAttachmentList() {
        return attachmentList;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public void setDelivery(Delivery delivery) {
        this.delivery = delivery;
    }

    public void setAttachmentList(List<MessageAttachment> attachmentList) {
        this.attachmentList = attachmentList;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public Message() {
    }
}