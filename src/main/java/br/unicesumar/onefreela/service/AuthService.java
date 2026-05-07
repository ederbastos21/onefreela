package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.LoginRequestDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.exception.ValidationException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.swing.*;
import java.util.ArrayList;
import java.util.List;

@Service
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessionService;

    public AuthService(UserService userService, PasswordEncoder passwordEncoder, SessionService sessionService){
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.sessionService = sessionService;
    }

    public void verifyPassword(String email, String password) {
        User user = userService.findByEmail(email);

        if (user == null) {
            throw new ValidationException(List.of(
                    new ErrorDetail(ErrorCode.EMAIL_DOES_NOT_EXIST, "login", "Email não existe no sistema")
            ));
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ValidationException(List.of(
                    new ErrorDetail(ErrorCode.INVALID_CREDENTIALS, "login", "Senha incorreta")
            ));
        }
    }

    public String authenticate(LoginRequestDTO loginRequestDTO) {
        List<ErrorDetail> errors = new ArrayList<>();

        //checks for errors
        if (loginRequestDTO.getPassword() == null) {
            errors.add(new ErrorDetail(ErrorCode.PASSWORD_REQUIRED, "login", "Senha é obrigatória"));
        }
        if (loginRequestDTO.getEmail() == null) {
            errors.add(new ErrorDetail(ErrorCode.EMAIL_REQUIRED, "login", "Email é obrigatório"));
        }
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        //extract object of existing user using email from loginRequestDTO
        User user = userService.findByEmail(loginRequestDTO.getEmail());

        //compares if the generated user object returns null. If it did, it means that the user doesn't exist
        if (user == null) {
            errors.add(new ErrorDetail(ErrorCode.EMAIL_DOES_NOT_EXIST, "login", "Email não existe no sistema"));
            throw new ValidationException(errors);
        }

        //here the email is of an existing account, and tries to check if the password provided is the same as the one from the user object extracted from the email
        if (!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getPassword())) {
            errors.add(new ErrorDetail(ErrorCode.INVALID_CREDENTIALS, "login", "Senha incorreta"));
            throw new ValidationException(errors);
        }

        //tries to extract an existing session instead of creating a new one
        String existingSession = sessionService.getSession(user.getId());
        if (existingSession != null){
            return existingSession;
        }

        //if credentials are correct and there's no active session, stores session
        return sessionService.storeSession(user.getId());
    }

    public String authenticate(HttpServletRequest httpRequest){
        String token = httpRequest.getHeader("Authorization");
        if (token == null){
            return null;
        }
        if (sessionService.getSession(token) != null){
            return token;
        }
        return null;
    }
}

