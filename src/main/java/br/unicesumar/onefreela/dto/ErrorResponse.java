package br.unicesumar.onefreela.dto;

import java.util.List;

public class ErrorResponse {
    private String code;
    private List<ErrorDetail> errors;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public List<ErrorDetail> getErrors() {
        return errors;
    }

    public void setErrors(List<ErrorDetail> errors) {
        this.errors = errors;
    }
}
