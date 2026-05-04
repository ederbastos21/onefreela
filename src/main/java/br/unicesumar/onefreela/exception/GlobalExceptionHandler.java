package br.unicesumar.onefreela.exception;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Map <String, String> handle (MethodArgumentNotValidException e){
        Map<String, String> errors = new HashMap<>();

        e.getBindingResult().getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });

        return errors;
    }

    @ExceptionHandler
    public ResponseEntity<ErrorResponse> handleValidation (ValidationException ex){
        ErrorResponse response = new ErrorResponse();

        ErrorCode code = ex.getCode();
        List<ErrorDetail> errors = ex.getErrors();

        response.setCode(code);
        response.setErrors(errors);

        return ResponseEntity.badRequest().body(response);
    }

}
