package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.UserResponse;
import br.unicesumar.onefreela.dto.UserUpdateRequest;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/*
@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser (@PathVariable Long id){
        Optional<User> opt = userService.findById(id);
        if (opt.isEmpty()){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("error: user not found");
        }
        return ResponseEntity.ok(UserResponse.fromEntity(opt.get()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser (@PathVariable Long id, @Valid @RequestBody UserUpdateRequest data){
        Optional<User> opt = userService.findById(id);
        if (opt.isEmpty()){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("error: user not found");
        }

        if (userService.isValidUpdateData(data, id)){
            User updated = userService.applyUpdate(opt.get(), data);
            return ResponseEntity.ok(UserResponse.fromEntity(updated));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("error: couldn't validate user");
        }
    }
}

 */