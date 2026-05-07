package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.LoginRequestDTO;
import br.unicesumar.onefreela.dto.UserRegisterDTO;
import br.unicesumar.onefreela.dto.UserResponse;
import br.unicesumar.onefreela.dto.UserUpdateDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthService authService;

    @PutMapping("/updateUser/{id}")
    public ResponseEntity<?> updateUser (@PathVariable Long id, @Valid @RequestBody UserUpdateDTO userUpdateDTO) {

        authService.verifyPassword(userUpdateDTO.getOldEmail(), userUpdateDTO.getOldPassword());
        userService.updateUser(userUpdateDTO, id);

        return ResponseEntity.ok().body("Alteração de dados realizada com sucesso");
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser (@Valid @RequestBody UserRegisterDTO user){
        userService.registerUser(user);
        return ResponseEntity.ok("registro Realizado com Sucesso");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login (@RequestBody LoginRequestDTO loginRequestDTO, HttpServletRequest httpRequest) {
        String token = authService.authenticate(loginRequestDTO, httpRequest);
        return ResponseEntity.ok(token);
    }
}
