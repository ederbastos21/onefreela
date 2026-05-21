package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.repository.CartItemRepository;
import br.unicesumar.onefreela.repository.CartRepository;
import org.springframework.stereotype.Service;

@Service
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final CartRepository cartRepository;

    public CartService(CartItemRepository cartItemRepository, CartRepository cartRepository){
        this.cartItemRepository = cartItemRepository;
        this.cartRepository = cartRepository;
    }
}
