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
    private final SessionService sessionService;
    private final UserValidator userValidator;
    private final UserMapper userMapper;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder,SessionService sessionService, UserValidator userValidator, UserMapper userMapper) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.sessionService = sessionService;
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
            save(userMapper.toUser(userRegisterDTO));
        } else {
            throw new ValidationException(errors);
        }
    }

    public void updateUser (UserUpdateDTO userUpdateDTO, Long userId){

        List <ErrorDetail> errors = new ArrayList<>();
        errors.addAll(userValidator.validateUpdate(userUpdateDTO));
        Optional<User> existingUserOptional = findById(userId);
        User existingUser = existingUserOptional.get();

        if (repository.findByEmail(userUpdateDTO.getNewEmail()) != null){
            errors.add(new ErrorDetail(ErrorCode.EMAIL_ALREADY_EXISTS, "email", "email já registrado no sistema"));
        }

        if (errors.isEmpty()){
            User savedUser = userMapper.toUser(userUpdateDTO);

            savedUser.setId(existingUser.getId());
            savedUser.setAdmin(existingUser.getAdmin());
            savedUser.setCpf(existingUser.getCpf());
            savedUser.setProfilePicturePath(existingUser.getProfilePicturePath());

            if (userUpdateDTO.getNewEmail() == null){
                savedUser.setEmail(existingUser.getEmail());
            }

            if (userUpdateDTO.getNewPassword() == null){
                savedUser.setPassword(existingUser.getPassword());
            }

            save(savedUser);
        } else {
            throw new ValidationException(errors);
        }
    }

    public void authenticateUser (LoginRequestDTO request){
        List<ErrorDetail> errors = new ArrayList<>();

        if (sessionService.getSession(request.getToken())!= null){
            System.out.println("deu certo login pelo token");
            return;
        }

        if (existsByEmail(request.getEmail())){
            User user = findByEmail(request.getEmail());

            if (passwordEncoder.matches(request.getPassword(), user.getPassword())){
                sessionService.storeSession(user.getId());
                return;
            }
            errors.add(new ErrorDetail(ErrorCode.VALIDATION_ERROR, "login", "Usuario ou senha incorretos"));
            throw new ValidationException(errors);
        }
        errors.add(new ErrorDetail(ErrorCode.EMAIL_DOES_NOT_EXIST, "login", "Email nao existe no sistema"));
    }


}
