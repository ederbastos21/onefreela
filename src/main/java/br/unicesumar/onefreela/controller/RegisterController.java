package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.UserRegisterDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/register")
public class RegisterController {

    @Autowired
    private UserService userService;
    @PostMapping
    public ResponseEntity<?> registerUser (@Valid @RequestBody UserRegisterDTO user){
        userService.createUser(user);
        return ResponseEntity.ok("registro Realizado com Sucesso");
    }
}
