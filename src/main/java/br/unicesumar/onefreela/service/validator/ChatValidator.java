package br.unicesumar.onefreela.service.validator;

import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.List;

@Component
public class ChatValidator {

    public List<ErrorDetail> validateMessage(String content) {

        List<ErrorDetail> errors = new ArrayList<>();

        if (content == null || content.isBlank()) {
            errors.add(new ErrorDetail(ErrorCode.CHAT_MESSAGE_REQUIRED, "content", "mensagem obrigatoria"));
            return errors;
        }

        if (content.length() > 5000) {
            errors.add(new ErrorDetail(ErrorCode.CHAT_MESSAGE_TOO_LONG, "content", "mensagem excede limite permitido"));
        }
        return errors;
    }
}