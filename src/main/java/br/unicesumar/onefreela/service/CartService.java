package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.AddCartItemDTO;
import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.entity.Cart;
import br.unicesumar.onefreela.entity.CartItem;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.CartItemRepository;
import br.unicesumar.onefreela.repository.CartRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.ArrayList;
import java.util.List;

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

    public List<CartItem> findAllCartItems(){
        return cartItemRepository.findAll();
    }

    public List<Cart> findAllCarts(){
        return cartRepository.findAll();
    }

    @Transactional
    public Cart addItem(AddCartItemDTO addCartItemDTO, User user){
        List <ErrorDetail> errors = new ArrayList<>();

        Cart cart = user.getCart();

        if (cart == null){
            errors.add (new ErrorDetail(ErrorCode.CART_NOT_FOUND, "cart", "o usuario nao possui um carrinho"));
            throw new ValidationException(errors);
        }

        Work work = workService.findById(addCartItemDTO.getWorkId());

        if (work == null){
            errors.add (new ErrorDetail(ErrorCode.WORK_NOT_FOUND, "cart", "o serviço enviado nao existe"));
        }

        CartItem cartItem = new CartItem();
        cartItem.setWork(work);
        cartItem.setCart(cart);
        cartItem.setAmount(addCartItemDTO.getAmount());
        cart.getCartItemList().add(cartItem);
        return cartRepository.save(cart);
    }

    @Transactional
    public void removeItem(Long id, User user){
        List <ErrorDetail> errors = new ArrayList<>();
        Cart cart = user.getCart();

        if (cart == null){
            errors.add (new ErrorDetail(ErrorCode.CART_NOT_FOUND, "cart", "o usuario nao possui um carrinho"));
            throw new ValidationException(errors);
        }

        List<CartItem> cartItemList = cart.getCartItemList();


        CartItem removableCartItem = null;

        for (CartItem cartItem : cartItemList){
            if (cartItem.getId().equals(id)){
                removableCartItem = cartItem;
            }
        }

        if (removableCartItem == null){
            errors.add( (new ErrorDetail(ErrorCode.CART_ITEM_ID_NOT_FOUND, "cart", "o item especificado nao foi encontrado")));
            throw new ValidationException(errors);
        }
        cartItemList.remove(removableCartItem);
        cart.setCartItemList(cartItemList);
        cartRepository.save(cart);
    }

    @Transactional
    public void adminRemoveItem(Long id, User user){
        cartItemRepository.deleteById(id);
    }


}
