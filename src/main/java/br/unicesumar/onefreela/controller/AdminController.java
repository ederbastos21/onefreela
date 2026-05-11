package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AuthService authService;
    private final UserService userService;

    public AdminController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @GetMapping("/users")
    public ResponseEntity<?> adminHome (HttpServletRequest httpServletRequest){
        if (authService.checkAdmin(httpServletRequest)){
            List<User> userList = userService.findAll();
            return ResponseEntity.ok().body(userList);
        }
        return null;
    }
}
