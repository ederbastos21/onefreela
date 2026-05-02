package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.LoginRequest;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/login")
public class AuthController {

    private final UserService userService;

    public AuthController (UserService userService){
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<?> login (@RequestBody LoginRequest request) {
        return userService.checkLoginCredentials(request);
    }
}
