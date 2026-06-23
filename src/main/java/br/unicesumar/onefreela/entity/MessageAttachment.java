package br.unicesumar.onefreela.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class MessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String path;
    private String extension;
    private String originalName;
    private LocalDate uploadedAt;
    private Long fileSize;

    @JsonIgnore
    @ManyToOne
    private Message message;

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

    public Message getMessage() {
        return message;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public void setExtension(String extension) {
        this.extension = extension;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public void setUploadedAt(LocalDate uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public void setMessage(Message message) {
        this.message = message;
    }
}