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

    @Autowired
    private UserService userService;
    @PostMapping
    public ResponseEntity<?> login (@RequestBody LoginRequest request){
        if (userService.existsByEmail(request.getEmail())){
            if (userService.findByEmail(request.getEmail()).getPassword().equals(request.getPassword())){
                return ResponseEntity.status(HttpStatus.ACCEPTED).body(request.getEmail() + request.getPassword());
            }
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(request.getEmail() + request.getPassword());
    }
}
