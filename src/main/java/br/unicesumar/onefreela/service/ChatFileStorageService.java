package br.unicesumar.onefreela.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class ChatFileStorageService {

    @Value("${app.upload.chat-dir}")
    private String chatUploadDir;

    public String store(MultipartFile file) {
        try {
            Files.createDirectories(Path.of(chatUploadDir));

            String originalFileName = file.getOriginalFilename();
            String extension = getExtension(originalFileName);
            String storedFileName = UUID.randomUUID() + extension;

            Path destination = Path.of(chatUploadDir, storedFileName);
            file.transferTo(destination);

            return destination.toString();

        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arquivo do chat", e);
        }
    }

    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}