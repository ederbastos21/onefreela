package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.AddCartItemDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.CartService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;
    private final AuthService authService;
    public CartController(CartService cartService, AuthService authService){
        this.cartService = cartService;
        this.authService = authService;
    }

    @PostMapping("/addItem")
    public ResponseEntity<?> addItem (HttpServletRequest httpServletRequest, @RequestBody AddCartItemDTO addCartItemDTO){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        cartService.addItem(addCartItemDTO, user);
        return ResponseEntity.ok().body("deu boa o carrinho");
    }
}
