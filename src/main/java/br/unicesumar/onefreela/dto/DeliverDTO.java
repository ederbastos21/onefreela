package br.unicesumar.onefreela.dto;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public class DeliverDTO {
    String message;
    List<MultipartFile> files;
    Long orderItemId;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getOrderItemId() {
        return orderItemId;
    }

    public void setOrderItemId(Long orderItemId) {
        this.orderItemId = orderItemId;
    }

    public List<MultipartFile> getFiles() {
        return files;
    }

    public void setFiles(List<MultipartFile> files) {
        this.files = files;
    }
}
