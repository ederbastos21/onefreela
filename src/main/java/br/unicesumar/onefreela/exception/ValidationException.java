package br.unicesumar.onefreela.exception;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;

import java.util.List;

public class ValidationException extends RuntimeException {
    private final List<ErrorDetail> errors;

    public ValidationException(List<ErrorDetail> errors) {
        this.errors = errors;
    }

    public ErrorCode getCode() {
        return ErrorCode.VALIDATION_ERROR;
    }

    public List<ErrorDetail> getErrors() {
        return errors;
    }
}
