package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.FavoriteResponse;
import br.unicesumar.onefreela.entity.Favorite;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.entity.Work;
import br.unicesumar.onefreela.enums.ErrorCode;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.FavoriteRepository;
import br.unicesumar.onefreela.repository.WorkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final WorkRepository workRepository;

    public FavoriteService(FavoriteRepository favoriteRepository, WorkRepository workRepository) {
        this.favoriteRepository = favoriteRepository;
        this.workRepository = workRepository;
    }

    @Transactional
    public FavoriteResponse addFavorite(User user, Long workId) {
        Work work = workRepository.findById(workId)
                .orElseThrow(() -> new ValidationException(List.of(
                        new ErrorDetail(ErrorCode.WORK_NOT_FOUND, "workId", "Serviço não encontrado"))));

        if (favoriteRepository.existsByUserIdAndWorkId(user.getId(), workId)) {
            throw new ValidationException(List.of(
                    new ErrorDetail(ErrorCode.FAVORITE_ALREADY_EXISTS, "workId", "Este serviço já está nos favoritos")));
        }

        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setWork(work);
        return FavoriteResponse.fromEntity(favoriteRepository.save(favorite));
    }

    @Transactional
    public void removeFavorite(User user, Long workId) {
        Favorite favorite = favoriteRepository.findByUserIdAndWorkId(user.getId(), workId)
                .orElseThrow(() -> new ValidationException(List.of(
                        new ErrorDetail(ErrorCode.FAVORITE_NOT_FOUND, "workId", "Favorito não encontrado"))));
        favoriteRepository.delete(favorite);
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> listFavorites(User user) {
        return favoriteRepository.findByUserId(user.getId())
                .stream()
                .map(FavoriteResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isFavorited(User user, Long workId) {
        return favoriteRepository.existsByUserIdAndWorkId(user.getId(), workId);
    }
}
