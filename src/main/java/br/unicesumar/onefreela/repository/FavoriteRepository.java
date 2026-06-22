package br.unicesumar.onefreela.repository;

import br.unicesumar.onefreela.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);
    boolean existsByUserIdAndWorkId(Long userId, Long workId);
    Optional<Favorite> findByUserIdAndWorkId(Long userId, Long workId);
}
