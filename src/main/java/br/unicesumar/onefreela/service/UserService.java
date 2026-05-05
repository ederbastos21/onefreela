package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.LoginRequestDTO;
import br.unicesumar.onefreela.dto.UserRegisterDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.UserRepository;
import br.unicesumar.onefreela.service.mapper.UserMapper;
import br.unicesumar.onefreela.service.validator.UserValidator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import br.unicesumar.onefreela.dto.UserUpdateDTO;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final UserValidator userValidator;
    private final UserMapper userMapper;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder, UserValidator userValidator, UserMapper userMapper) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.userValidator = userValidator;
        this.userMapper = userMapper;
    }

    public List<User> findAll() {
        return repository.findAll();
    }
    
    public Optional<User> findById (Long id){
        return repository.findById(id);
    }

    public User save(User user) {
        return repository.save(user);
    }

    public User findByEmail(String email){
        return repository.findByEmail(email);
    }

    public Boolean existsByEmail (String email){
        return repository.existsByEmail(email);
    }

    public void registerUser(UserRegisterDTO userRegisterDTO){

        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(userValidator.validateRegister(userRegisterDTO));

        if (repository.findByEmail(userRegisterDTO.getEmail()) != null){
            errors.add(new ErrorDetail(ErrorCode.EMAIL_ALREADY_EXISTS, "email", "email já registrado no sistema"));
        }

        if (errors.isEmpty()){
            User newUser = userMapper.toUser(userRegisterDTO);
            newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
            save(newUser);
        } else {
            throw new ValidationException(errors);
        }
    }

    public void updateUser(UserUpdateDTO userUpdateDTO, Long userId) {

        List<ErrorDetail> errors = new ArrayList<>();
        errors.addAll(userValidator.validateUpdate(userUpdateDTO));

        if (repository.existsByEmailAndIdNot(userUpdateDTO.getNewEmail(), userId)) {
            errors.add(new ErrorDetail(ErrorCode.EMAIL_ALREADY_EXISTS, "email", "Email já registrado no sistema"));
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }

        User existing = repository.findById(userId)
                .orElseThrow(() -> new ValidationException(List.of(
                        new ErrorDetail(ErrorCode.VALIDATION_ERROR, "id", "Usuário não encontrado")
                )));

        User updated = userMapper.toUser(userUpdateDTO);
        updated.setId(existing.getId());
        updated.setAdmin(existing.getAdmin());
        updated.setVerified(existing.getVerified());
        updated.setCpf(existing.getCpf());
        updated.setPassword(passwordEncoder.encode(userUpdateDTO.getNewPassword()));

        repository.save(updated);
    }
}
