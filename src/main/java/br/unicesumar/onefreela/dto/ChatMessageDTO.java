package br.unicesumar.onefreela.dto;

import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public class ChatMessageDTO {
    private String content;
    private List<MultipartFile> files;

    public String getContent() {
        return content;
    }

    public List<MultipartFile> getFiles() {
        return files;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public void setFiles(List<MultipartFile> files) {
        this.files = files;
    }
}