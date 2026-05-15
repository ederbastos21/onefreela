package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.LoginRequestDTO;
import br.unicesumar.onefreela.dto.UserRegisterDTO;
import br.unicesumar.onefreela.dto.UserUpdateDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthService authService;

    @PutMapping("/updateUser")
    public ResponseEntity<?> updateUser (@Valid @RequestBody UserUpdateDTO userUpdateDTO) {

        //tries to authenticate user with passed credentials
        User authenticatedUser = authService.verifyPassword(userUpdateDTO.getOldEmail(), userUpdateDTO.getOldPassword());

        //if the codes reaches here, the user was authenticated and the modifications will be updated
        userService.updateUser(authenticatedUser, userUpdateDTO);

        return ResponseEntity.ok().body("Alteração de dados realizada com sucesso");
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser (@Valid @RequestBody UserRegisterDTO user){
        userService.registerUser(user);
        return ResponseEntity.ok("registro Realizado com Sucesso");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login (@RequestBody LoginRequestDTO loginRequestDTO) {
        //first auth checks if existing token is valid
        String token = authService.authenticate(loginRequestDTO);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/loginToken")
    public ResponseEntity<?> login (HttpServletRequest httpRequest) {
        String token = authService.authenticate(httpRequest);
        return ResponseEntity.ok(token);
    }
}
