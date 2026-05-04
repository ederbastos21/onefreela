package br.unicesumar.onefreela.service.mapper;

import br.unicesumar.onefreela.dto.UserRegisterDTO;
import br.unicesumar.onefreela.dto.UserUpdateDTO;
import br.unicesumar.onefreela.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public User toUser(UserRegisterDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setCpf(dto.getCpf());
        user.setBirthday(dto.getBirthday());
        user.setPhoneNumber(dto.getPhoneNumber());

        return user;
    }

    public User toUser(UserUpdateDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getNewEmail());
        user.setPassword(dto.getNewPassword());
        user.setBirthday(dto.getBirthday());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setProfilePicturePath(dto.getProfilePicturePath());
        return user;
    }
}
