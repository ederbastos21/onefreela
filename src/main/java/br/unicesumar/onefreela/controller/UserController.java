package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.LoginRequestDTO;
import br.unicesumar.onefreela.dto.UserResponse;
import br.unicesumar.onefreela.dto.UserUpdateDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.UserService;
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

    @PutMapping("/updateUser/{id}")
    public ResponseEntity<?> updateUser (@PathVariable Long id, @Valid @RequestBody UserUpdateDTO userUpdateDTO){
        LoginRequestDTO loginRequestDTO = new LoginRequestDTO();
        loginRequestDTO.setEmail(userUpdateDTO.getOldEmail());
        loginRequestDTO.setPassword(userUpdateDTO.getOldPassword());

        userService.authenticateUser(loginRequestDTO);
        userService.updateUser(userUpdateDTO, id);

        return ResponseEntity.ok().body("Alteração de dados realizada com sucesso");

    }
}
