package br.unicesumar.onefreela.service.validator;

import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.enums.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.util.ArrayList;
import java.util.List;

@Component
public class ChatValidator {

    public List<ErrorDetail> validateMessage(String content, List<MultipartFile> files) {
        List<ErrorDetail> errors = new ArrayList<>();

        boolean hasContent = content != null && !content.isBlank();
        boolean hasFiles = files != null && !files.isEmpty();

        if (!hasContent && !hasFiles) {
            errors.add(new ErrorDetail(ErrorCode.CHAT_MESSAGE_REQUIRED, "content", "mensagem ou anexo obrigatorio"));
            return errors;
        }

        if (hasContent && content.length() > 5000) {
            errors.add(new ErrorDetail(ErrorCode.CHAT_MESSAGE_TOO_LONG, "content", "mensagem excede limite permitido"));
        }

        return errors;
    }

    public List<ErrorDetail> validateMessage(String content) {
        return validateMessage(content, null);
    }
}