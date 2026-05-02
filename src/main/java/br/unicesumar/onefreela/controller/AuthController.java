package br.unicesumar.onefreela.controller;

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
public class AuthController {

    @Autowired
    private UserService userService;
    @PostMapping
    public ResponseEntity<?> createUser (@Valid @RequestBody User user){
        user.setAdmin(false);
        if (userService.isValidUserData(user)){
            User savedUser = userService.save(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("error: couldn't validate user");
        }
    }

    @PostMapping("/noDB")
    public ResponseEntity<?> createUserNoSaveDb (@Valid @RequestBody User user){
        user.setAdmin(false);
        if (userService.isValidUserData(user)){
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("error: couldn't validate user");
        }
    }
}
