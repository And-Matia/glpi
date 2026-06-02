package matia.glpicore.presentation.controller;

import lombok.extern.slf4j.Slf4j;
import matia.glpicore.application.dto.UserApplicationDTO;
import matia.glpicore.application.service.UserService;
import matia.glpicore.presentation.request.CreateUserRequest;
import matia.glpicore.presentation.request.UpdateUserRequest;
import matia.glpicore.presentation.response.UserResponse;
import matia.glpicore.util.mapper.UserMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@Slf4j
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    public UserController(UserService userService, UserMapper userMapper) {
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody CreateUserRequest request) {
        log.info("POST /users - Creating user with email: {}", request.getEmail());
        UserApplicationDTO dto = userService.createUser(request);
        UserResponse response = userMapper.toResponse(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        log.info("GET /users/{} - Fetching user", id);
        UserApplicationDTO dto = userService.getUserById(id);
        UserResponse response = userMapper.toResponse(dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        log.info("GET /users/email/{} - Fetching user by email", email);
        UserApplicationDTO dto = userService.getUserByEmail(email);
        UserResponse response = userMapper.toResponse(dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        log.info("GET /users - Fetching all users");
        List<UserApplicationDTO> dtos = userService.getAllUsers();
        List<UserResponse> responses = dtos.stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        log.info("PUT /users/{} - Updating user", id);
        UserApplicationDTO dto = userService.updateUser(id, request);
        UserResponse response = userMapper.toResponse(dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        log.info("DELETE /users/{} - Deleting user", id);
        userService.deleteUser(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
