package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.AddCartItemDTO;
import br.unicesumar.onefreela.entity.Cart;
import br.unicesumar.onefreela.entity.CartItem;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.repository.CartItemRepository;
import br.unicesumar.onefreela.repository.CartRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

@Service
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final CartRepository cartRepository;
    private final WorkService workService;

    public CartService(CartItemRepository cartItemRepository, CartRepository cartRepository, WorkService workService){
        this.cartItemRepository = cartItemRepository;
        this.cartRepository = cartRepository;
        this.workService = workService;
    }

    public void createCart(User user){
        Cart cart = new Cart();
        cart.setUser(user);
        cartRepository.save(cart);
    }

    public Cart addItem(AddCartItemDTO addCartItemDTO, User user){
        Cart cart = user.getCart();
        Work work = workService.findById(addCartItemDTO.getWorkId());
        CartItem cartItem = new CartItem();
        cartItem.setWork(work);
        cartItem.setCart(cart);
        cartItem.setAmount(addCartItemDTO.getAmount());
        cart.getCartItemList().add(cartItem);
        return cartRepository.save(cart);
    }
}
