package br.unicesumar.onefreela.service;

import br.unicesumar.onefreela.dto.ErrorCode;
import br.unicesumar.onefreela.dto.ErrorDetail;
import br.unicesumar.onefreela.dto.LoginRequest;
import br.unicesumar.onefreela.dto.UserRegisterDTO;
import br.unicesumar.onefreela.entity.User;
import br.unicesumar.onefreela.exception.ValidationException;
import br.unicesumar.onefreela.repository.UserRepository;
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

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder,SessionService sessionService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.sessionService = sessionService;
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

    public void createUser (UserRegisterDTO user){


        if (errors.isEmpty()){
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            save(user);
        } else {
            throw new ValidationException(errors);
        }
    }

    public void checkLoginCredentials (LoginRequest request){
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

    public void isValidUpdateData (UserUpdateDTO data, Long userId){
    
        String name = data.getName();
        String password = data.getPassword();
        String email = data.getEmail();
        LocalDate birthday = data.getBirthday();
        String phoneNumber = data.getPhoneNumber();

        List <ErrorDetail> errors = new ArrayList<>();

        errors.addAll(isValidName(name));
        errors.addAll(isValidBirthday(birthday));
        errors.addAll(isValidPassword(password));
        errors.addAll(isValidPhoneNumber(phoneNumber));
        errors.addAll(isValidEmailFormat(email));
    
        if (repository.existsByEmailAndIdNot(email, userId)){
            errors.add(new ErrorDetail(ErrorCode.EMAIL_ALREADY_EXISTS, "email", "email já registrado no sistema"));
        }

        if (errors.isEmpty()){
            data.setPassword(passwordEncoder.encode(data.getPassword()));
            User createdUser = new User();
            createdUser.setEmail(data.getEmail());
            createdUser.setPassword(data.getPassword());
            createdUser.setName(data.getName());
            createdUser.setBirthday(data.getBirthday());
            createdUser.setPhoneNumber(data.getPhoneNumber());

            save(createdUser);
        } else {
            throw new ValidationException(errors);
        }
    }
    
    public User applyUpdate (User existing, UserUpdateDTO data){
        existing.setName(data.getName());
        existing.setPassword(data.getPassword());
        existing.setEmail(data.getEmail());
        existing.setBirthday(data.getBirthday());
        existing.setPhoneNumber(data.getPhoneNumber());
        existing.setProfilePicturePath(data.getProfilePicturePath());
        return repository.save(existing);
    }
}
