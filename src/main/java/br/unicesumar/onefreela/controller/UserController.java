package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    public List<User> findAll() {
        return service.findAll();
    }

    @PostMapping
    public User create(@RequestBody User user) {
        return service.save(user);
    }
}