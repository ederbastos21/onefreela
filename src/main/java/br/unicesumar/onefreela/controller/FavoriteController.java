package br.unicesumar.onefreela.controller;

import br.unicesumar.onefreela.dto.FavoriteResponse;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.service.AuthService;
import br.unicesumar.onefreela.service.FavoriteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final AuthService authService;

    public FavoriteController(FavoriteService favoriteService, AuthService authService) {
        this.favoriteService = favoriteService;
        this.authService = authService;
    }

    @PostMapping("/{workId}")
    public ResponseEntity<FavoriteResponse> add(HttpServletRequest request, @PathVariable Long workId) {
        User user = authService.getAuthenticatedUser(request);
        return ResponseEntity.ok(favoriteService.addFavorite(user, workId));
    }

    @DeleteMapping("/{workId}")
    public ResponseEntity<Void> remove(HttpServletRequest request, @PathVariable Long workId) {
        User user = authService.getAuthenticatedUser(request);
        favoriteService.removeFavorite(user, workId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<FavoriteResponse>> list(HttpServletRequest request) {
        User user = authService.getAuthenticatedUser(request);
        return ResponseEntity.ok(favoriteService.listFavorites(user));
    }

    @GetMapping("/{workId}/check")
    public ResponseEntity<Map<String, Boolean>> check(HttpServletRequest request, @PathVariable Long workId) {
        User user = authService.getAuthenticatedUser(request);
        boolean favorited = favoriteService.isFavorited(user, workId);
        return ResponseEntity.ok(Map.of("favorited", favorited));
    }
}
