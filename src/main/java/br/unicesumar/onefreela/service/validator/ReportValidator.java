package br.unicesumar.onefreela.service.validator;

import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.ReportRegisterDTO;
import br.unicesumar.onefreela.dto.ReportReviewDTO;
import br.unicesumar.onefreela.enums.ReportNature;
import br.unicesumar.onefreela.enums.ReportStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.util.ArrayList;
import java.util.List;

@Component
public class ReportValidator {

    private static final int MAX_ATTACHMENTS = 5;
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private List<ErrorDetail> isValidNature(String nature) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (nature == null || nature.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_NATURE_REQUIRED, "nature", "A natureza da denúncia é obrigatória"));
            return errors;
        }

        try {
            ReportNature.valueOf(nature);
        } catch (IllegalArgumentException e) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_NATURE_INVALID, "nature", "Natureza de denúncia inválida"));
        }
        return errors;
    }

    private List<ErrorDetail> isValidTitle(String title) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (title == null || title.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_TITLE_REQUIRED, "title", "O título da denúncia é obrigatório"));
            return errors;
        }

        if (title.length() < 5) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_TITLE_TOO_SHORT, "title", "O título deve ter pelo menos 5 caracteres"));
        }

        if (title.length() > 120) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_TITLE_TOO_LONG, "title", "O título deve ter no máximo 120 caracteres"));
        }
        return errors;
    }

    private List<ErrorDetail> isValidDescription(String description) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (description == null || description.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_DESCRIPTION_REQUIRED, "description", "A descrição da denúncia é obrigatória"));
            return errors;
        }

        if (description.length() < 20) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_DESCRIPTION_TOO_SHORT, "description", "A descrição deve ter pelo menos 20 caracteres"));
        }

        if (description.length() > 5000) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_DESCRIPTION_TOO_LONG, "description", "A descrição deve ter no máximo 5000 caracteres"));
        }
        return errors;
    }

    private List<ErrorDetail> isValidStatus(String status) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (status == null || status.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_STATUS_REQUIRED, "status", "O status da denúncia é obrigatório"));
            return errors;
        }

        try {
            ReportStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_STATUS_INVALID, "status", "Status de denúncia inválido"));
        }
        return errors;
    }

    public List<ErrorDetail> validateRegister(ReportRegisterDTO reportRegisterDTO, List<MultipartFile> attachments) {
        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(isValidNature(reportRegisterDTO.getNature()));
        errors.addAll(isValidTitle(reportRegisterDTO.getTitle()));
        errors.addAll(isValidDescription(reportRegisterDTO.getDescription()));
        errors.addAll(validateAttachments(attachments));
        return errors;
    }

    public List<ErrorDetail> validateReview(ReportReviewDTO reportReviewDTO) {
        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(isValidStatus(reportReviewDTO.getStatus()));
        return errors;
    }

    public List<ErrorDetail> validateAttachments(List<MultipartFile> attachments) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (attachments == null || attachments.isEmpty()) {
            return errors;
        }

        if (attachments.size() > MAX_ATTACHMENTS) {
            errors.add(new ErrorDetail(ErrorCode.REPORT_ATTACHMENT_LIMIT_EXCEEDED, "attachments", "A denúncia pode ter no máximo 5 anexos"));
            return errors;
        }

        for (MultipartFile file : attachments) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            if (file.getSize() > MAX_FILE_SIZE) {
                errors.add(new ErrorDetail(ErrorCode.REPORT_ATTACHMENT_TOO_LARGE, "attachments", "Cada anexo deve ter no máximo 10MB"));
            }
            String contentType = file.getContentType();
            if (!isAllowedContentType(contentType)) {
                errors.add(new ErrorDetail(ErrorCode.REPORT_ATTACHMENT_INVALID, "attachments", "Anexos devem ser imagens ou arquivos PDF"));
            }
        }
        return errors;
    }

    private boolean isAllowedContentType(String contentType) {
        return contentType != null && (contentType.equals("image/png") || contentType.equals("image/jpeg") || contentType.equals("image/jpg") || contentType.equals("image/webp") || contentType.equals("application/pdf"));
    }
}