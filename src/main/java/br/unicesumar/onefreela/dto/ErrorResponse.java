package br.unicesumar.onefreela.dto;

import java.util.List;

public class ErrorResponse {
    private String code;
    private List<FieldErrorResponse> errors;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public List<FieldErrorResponse> getErrors() {
        return errors;
    }

    public void setErrors(List<FieldErrorResponse> errors) {
        this.errors = errors;
    }
}
