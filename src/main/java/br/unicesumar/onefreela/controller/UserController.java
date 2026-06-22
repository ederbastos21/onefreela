package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.LoginRequestDTO;
import br.unicesumar.onefreela.dto.LoginResponseDTO;
import br.unicesumar.onefreela.dto.UserRegisterDTO;
import br.unicesumar.onefreela.dto.UserUpdateDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.SessionService;
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

    @Autowired
    SessionService sessionService;

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
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO loginRequestDTO) {
        String token = authService.authenticate(loginRequestDTO);
        long expiresAt = System.currentTimeMillis() + SessionService.SESSION_TTL_MS;
        return ResponseEntity.ok(new LoginResponseDTO(token, expiresAt));
    }

    @PostMapping("/loginToken")
    public ResponseEntity<?> login (HttpServletRequest httpRequest) {
        String token = authService.authenticate(httpRequest);
        Long id = Long.parseLong(sessionService.getSession(token).toString());
        User user = userService.findById(id).orElseThrow(() -> new RuntimeException("Usuario nao encontrado com token"));
        return ResponseEntity.ok().body(user);
    }
}
