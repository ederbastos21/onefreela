package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.enums.ErrorCode;

public class ErrorDetail {
    private ErrorCode code;
    private String field;
    private String message;

    public ErrorDetail(ErrorCode code, String field, String message) {
        this.code = code;
        this.field = field;
        this.message = message;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ErrorCode getCode() {
        return code;
    }

    public void setCode(ErrorCode code) {
        this.code = code;
    }
}
