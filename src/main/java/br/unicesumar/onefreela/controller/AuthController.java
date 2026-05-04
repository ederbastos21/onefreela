package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.LoginRequestDTO;
import br.unicesumar.onefreela.service.UserService;
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
    public ResponseEntity<?> login (@RequestBody LoginRequestDTO request) {
        userService.authenticateUser(request);
        return ResponseEntity.ok("login Realizado com Sucesso");
    }
}
