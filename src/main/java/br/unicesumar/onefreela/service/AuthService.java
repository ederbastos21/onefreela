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

    public String authenticate(LoginRequestDTO loginRequestDTO, HttpServletRequest httpRequest) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (loginRequestDTO.getPassword() == null) {
            errors.add(new ErrorDetail(ErrorCode.PASSWORD_REQUIRED, "login", "Senha é obrigatória"));
        }
        if (loginRequestDTO.getEmail() == null) {
            errors.add(new ErrorDetail(ErrorCode.EMAIL_REQUIRED, "login", "Email é obrigatório"));
        }
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        String token = httpRequest.getHeader("Authorization");
        String session = null;

        if (token != null){
            session = sessionService.getSession(token);
        }

        User user = userService.findByEmail(loginRequestDTO.getEmail());


        //caso token seja valido e corresponda ao usuario, retorna token
        if (user != null && session != null && session.equals(user.getId().toString())){
            return token;
        }

        if (user == null) {
            errors.add(new ErrorDetail(ErrorCode.EMAIL_DOES_NOT_EXIST, "login", "Email não existe no sistema"));
            throw new ValidationException(errors);
        }

        if (!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getPassword())) {
            errors.add(new ErrorDetail(ErrorCode.INVALID_CREDENTIALS, "login", "Senha incorreta"));
            throw new ValidationException(errors);
        }

        //caso token nao seja valido ou nulo, vai remover dados anteriores do usuario e sobreescrever a sessão
        if (sessionService.getSession(user.getId()) == null){
            return sessionService.storeSession(user.getId());
        } else {
            sessionService.removeSession(user.getId());
            return sessionService.storeSession(user.getId());
        }
    }
}

