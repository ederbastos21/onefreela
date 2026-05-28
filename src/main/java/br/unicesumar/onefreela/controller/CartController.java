package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.AddCartItemDTO;
import br.unicesumar.onefreela.entity.Cart;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.CartService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;
    private final AuthService authService;
    public CartController(CartService cartService, AuthService authService){
        this.cartService = cartService;
        this.authService = authService;
    }

    @GetMapping("/show")
    public ResponseEntity<?> showCartItems (HttpServletRequest httpServletRequest){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        Cart cart = user.getCart();
        return ResponseEntity.ok().body(cart);
    }

    @PostMapping("/addItem")
    public ResponseEntity<?> addItem (HttpServletRequest httpServletRequest, @RequestBody AddCartItemDTO addCartItemDTO){
        User user = authService.getAuthenticatedUser(httpServletRequest);
        cartService.addItem(addCartItemDTO, user);
        return ResponseEntity.ok().body(user.getCart().getCartItemList());
    }

    @PostMapping("/removeItem/{id}")
    public ResponseEntity<?> removeItem (HttpServletRequest httpServletRequest, @PathVariable Long id){
        User user = authService.getAuthenticatedUser(httpServletRequest);

        cartService.removeItem(id, user);
        return ResponseEntity.ok().body(user.getCart().getCartItemList());
    }
}
