package br.unicesumar.onefreela.dto;

import br.unicesumar.onefreela.entity.Favorite;
import java.time.LocalDateTime;

public class FavoriteResponse {

    private Long favoriteId;
    private LocalDateTime favoritedAt;
    private WorkResponse work;

    public static FavoriteResponse fromEntity(Favorite f) {
        FavoriteResponse r = new FavoriteResponse();
        r.favoriteId = f.getId();
        r.favoritedAt = f.getCreatedAt();
        r.work = WorkResponse.fromEntity(f.getWork());
        return r;
    }

    public Long getFavoriteId() { return favoriteId; }
    public LocalDateTime getFavoritedAt() { return favoritedAt; }
    public WorkResponse getWork() { return work; }

    public FavoriteResponse() {}
}
