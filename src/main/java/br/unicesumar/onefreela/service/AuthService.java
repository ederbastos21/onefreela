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

    // validates email and password during a standalone login check, creates user object
    public User verifyPassword(String email, String password) {
        List<ErrorDetail> errors = new ArrayList<>();

        User user = userService.findByEmail(email);

        if (user == null) {
            errors.add(new ErrorDetail(ErrorCode.EMAIL_DOES_NOT_EXIST, "login", "Email não existe no sistema"));
            throw new ValidationException(errors);
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            errors.add(new ErrorDetail(ErrorCode.INVALID_CREDENTIALS, "login", "Senha incorreta"));
            throw new ValidationException(errors);
        }

        return user;
    }

    // validates email and password when the User object is already available.
    public void verifyPassword(String password, User user) {
        List<ErrorDetail> errors = new ArrayList<>();

        if (user == null) {
            errors.add(new ErrorDetail(ErrorCode.EMAIL_DOES_NOT_EXIST, "login", "Email não existe no sistema"));
            throw new ValidationException(errors);
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            errors.add(new ErrorDetail(ErrorCode.INVALID_CREDENTIALS, "login", "Senha incorreta"));
            throw new ValidationException(errors);
        }
    }

    //validates login when LoginRequestDTO is passed, which the email and password is passed
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

        verifyPassword(loginRequestDTO.getPassword(), user);

        //tries to extract an existing session instead of creating a new one
        String existingSession = sessionService.getSession(user.getId());
        if (existingSession != null){
            System.out.println("[INFO] user " + user.getId() + " already has active session token: " + existingSession);
            System.out.println("[RESULT] - user logged by credentials");
            return existingSession;
        }

        //if credentials are correct and there's no active session, stores session
        String newSession = sessionService.storeSession(user.getId());
        System.out.println("[INFO] user " + user.getId() + " doesn't have active token");
        System.out.println("[RESULT] - new token created: "+newSession);
        System.out.println("[RESULT] - user logged by credentials");

        return newSession;
    }

    //this method is used for session checks, when the only value passed in the requisition is the token
    public String authenticate(HttpServletRequest httpRequest){
        List<ErrorDetail> errors = new ArrayList<>();
        String token = httpRequest.getHeader("Authorization");
        if (token == null){
            return null;
        }
        if (sessionService.getSession(token) != null){
            System.out.println("[INFO] Token" + token + " inserted");
            System.out.println("[RESULT ] - user logged by token");
            return token;
        }

        errors.add(new ErrorDetail(ErrorCode.TOKEN_NOT_FOUND, "token", "token inserido nao corresponde a nenhum registrado"));
        System.out.println("[INFO] inserted token doesn't exist");
        throw new ValidationException(errors);
    }
}

