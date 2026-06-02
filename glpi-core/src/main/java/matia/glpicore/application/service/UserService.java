package matia.glpicore.application.service;

import matia.glpicore.application.dto.UserApplicationDTO;
import matia.glpicore.presentation.request.CreateUserRequest;
import matia.glpicore.presentation.request.UpdateUserRequest;

import java.util.List;

public interface UserService {
    UserApplicationDTO createUser(CreateUserRequest request);
    UserApplicationDTO getUserById(Long id);
    UserApplicationDTO getUserByEmail(String email);
    List<UserApplicationDTO> getAllUsers();
    UserApplicationDTO updateUser(Long id, UpdateUserRequest request);
    void deleteUser(Long id);
}
