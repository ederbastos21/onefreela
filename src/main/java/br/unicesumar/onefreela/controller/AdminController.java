package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.entity.Cart;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.CartService;
import br.unicesumar.onefreela.service.UserService;
import br.unicesumar.onefreela.service.WorkService;
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
    private final WorkService workService;
    private final CartService cartService;

    public AdminController(AuthService authService, UserService userService, WorkService workService, CartService cartService) {
        this.authService = authService;
        this.userService = userService;
        this.workService = workService;
        this.cartService = cartService;
    }

    @GetMapping("/users")
    public ResponseEntity<?> showUsers (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if (authService.checkAdmin(httpServletRequest, user)){
            List<User> users = userService.findAll();
            return ResponseEntity.ok().body(users);
        }
        return null;
    }

    @GetMapping("/works")
    public ResponseEntity<?> showWorks (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if(authService.checkAdmin(httpServletRequest, user)){
            List<Work> works = workService.findAll();
            return ResponseEntity.ok().body(works);
        }
        return null;
    }

    @GetMapping("/carts")
    public ResponseEntity<?> showCarts (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        if (authService.checkAdmin(httpServletRequest, user)){
            List<Cart> carts = cartService.findAllCarts();
            return ResponseEntity.ok().body(carts);
        }
        return null;
    }
}
