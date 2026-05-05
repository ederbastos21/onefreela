package br.unicesumar.onefreela.exception;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.ErrorResponse;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<ErrorDetail> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> new ErrorDetail(
                        ErrorCode.VALIDATION_ERROR,
                        fieldError.getField(),
                        fieldError.getDefaultMessage()
                ))
                .toList();

        ErrorResponse response = new ErrorResponse();
        response.setCode(ErrorCode.VALIDATION_ERROR);
        response.setErrors(errors);
        response.setMethod(request.getMethod());
        response.setPath(request.getRequestURI());
        response.setTimestamp(ZonedDateTime.now(ZoneId.of("America/Sao_Paulo")).toLocalDateTime().toString());

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler
    public ResponseEntity<ErrorResponse> handleValidation (ValidationException ex, HttpServletRequest request){
        ErrorResponse response = new ErrorResponse();

        ErrorCode code = ex.getCode();
        List<ErrorDetail> errors = ex.getErrors();

        response.setCode(code);
        response.setErrors(errors);
        response.setMethod(request.getMethod());
        response.setPath(request.getRequestURI());
        response.setTimestamp(ZonedDateTime.now(ZoneId.of("America/Sao_Paulo")).toLocalDateTime().toString());

        return ResponseEntity.badRequest().body(response);
    }

}
