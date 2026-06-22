package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.ReportAttachment;
import java.time.LocalDateTime;

public class ReportAttachmentResponse {

    private Long id;
    private String originalFileName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime uploadedAt;

    public static ReportAttachmentResponse fromEntity(ReportAttachment attachment) {
        ReportAttachmentResponse response = new ReportAttachmentResponse();
        response.id = attachment.getId();
        response.originalFileName = attachment.getOriginalFileName();
        response.contentType = attachment.getContentType();
        response.fileSize = attachment.getFileSize();
        response.uploadedAt = attachment.getUploadedAt();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public ReportAttachmentResponse() {}
}