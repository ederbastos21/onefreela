package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.entity.ReportAttachment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class ReportFileStorageService {

    @Value("${app.upload.report-dir}")
    private String reportUploadDir;

    public ReportAttachment store(MultipartFile file) {
        try {
            Files.createDirectories(Path.of(reportUploadDir));
            String originalFileName = file.getOriginalFilename();
            String extension = getExtension(originalFileName);
            String storedFileName = UUID.randomUUID() + extension;
            Path destination = Path.of(reportUploadDir, storedFileName);
            file.transferTo(destination);

            ReportAttachment attachment = new ReportAttachment();
            attachment.setOriginalFileName(originalFileName);
            attachment.setStoredFileName(storedFileName);
            attachment.setContentType(file.getContentType());
            attachment.setFileSize(file.getSize());
            attachment.setFilePath(destination.toString());
            return attachment;

        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar anexo da denúncia", e);
        }
    }

    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}