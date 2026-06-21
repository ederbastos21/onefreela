package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.MessageAttachment;
import java.time.LocalDate;

public class MessageAttachmentResponse {
    private Long id;
    private String path;
    private String extension;
    private String originalName;
    private LocalDate uploadedAt;
    private Long fileSize;

    public static MessageAttachmentResponse fromEntity(MessageAttachment attachment) {
        MessageAttachmentResponse response = new MessageAttachmentResponse();

        response.id = attachment.getId();
        response.path = attachment.getPath();
        response.extension = attachment.getExtension();
        response.originalName = attachment.getOriginalName();
        response.uploadedAt = attachment.getUploadedAt();
        response.fileSize = attachment.getFileSize();

        return response;
    }

    public Long getId() {
        return id;
    }

    public String getPath() {
        return path;
    }

    public String getExtension() {
        return extension;
    }

    public String getOriginalName() {
        return originalName;
    }

    public LocalDate getUploadedAt() {
        return uploadedAt;
    }

    public Long getFileSize() {
        return fileSize;
    }
}