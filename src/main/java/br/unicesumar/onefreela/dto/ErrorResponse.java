package br.unicesumar.onefreela.dto;

import java.util.List;

public class ErrorResponse {
    private ErrorCode code;
    private List<ErrorDetail> errors;

    public ErrorCode getCode() {
        return code;
    }

    public void setCode(ErrorCode code) {
        this.code = code;
    }

    public List<ErrorDetail> getErrors() {
        return errors;
    }

    public void setErrors(List<ErrorDetail> errors) {
        this.errors = errors;
    }
}
