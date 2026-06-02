package matia.glpicore.application.service.impl;

import lombok.extern.slf4j.Slf4j;
import matia.glpicore.application.dto.UserApplicationDTO;
import matia.glpicore.application.service.UserService;
import matia.glpicore.domain.entity.User;
import matia.glpicore.exception.DuplicateResourceException;
import matia.glpicore.exception.ResourceNotFoundException;
import matia.glpicore.infrastructure.repository.UserRepository;
import matia.glpicore.presentation.request.CreateUserRequest;
import matia.glpicore.presentation.request.UpdateUserRequest;
import matia.glpicore.util.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Override
    public UserApplicationDTO createUser(CreateUserRequest request) {
        log.info("Creating new user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User with email '" + request.getEmail() + "' already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User created successfully with id: {}", savedUser.getId());
        return userMapper.toApplicationDTO(savedUser);
    }

    @Override
    public UserApplicationDTO getUserById(Long id) {
        log.info("Fetching user with id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return userMapper.toApplicationDTO(user);
    }

    @Override
    public UserApplicationDTO getUserByEmail(String email) {
        log.info("Fetching user with email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return userMapper.toApplicationDTO(user);
    }

    @Override
    public List<UserApplicationDTO> getAllUsers() {
        log.info("Fetching all users");
        return userRepository.findAll().stream()
                .map(userMapper::toApplicationDTO)
                .collect(Collectors.toList());
    }

    @Override
    public UserApplicationDTO updateUser(Long id, UpdateUserRequest request) {
        log.info("Updating user with id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        User updatedUser = userRepository.save(user);
        log.info("User updated successfully with id: {}", id);
        return userMapper.toApplicationDTO(updatedUser);
    }

    @Override
    public void deleteUser(Long id) {
        log.info("Deleting user with id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
        log.info("User deleted successfully with id: {}", id);
    }
}
