package br.unicesumar.onefreela.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class DeliveryFileStorageService {

    @Value("${app.upload.delivery-dir}")
    private String deliveryUploadDir;

    public String store(MultipartFile file) {
        try {
            Files.createDirectories(Path.of(deliveryUploadDir));

            String originalFileName = file.getOriginalFilename();
            String extension = getExtension(originalFileName);
            String storedFileName = UUID.randomUUID() + extension;

            Path destination = Path.of(deliveryUploadDir, storedFileName);
            file.transferTo(destination);

            return destination.toString();

        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arquivo da entrega", e);
        }
    }

    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}