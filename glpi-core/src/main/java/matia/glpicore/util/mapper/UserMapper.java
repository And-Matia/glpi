package matia.glpicore.util.mapper;

import matia.glpicore.application.dto.UserApplicationDTO;
import matia.glpicore.domain.entity.User;
import matia.glpicore.presentation.response.UserResponse;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserApplicationDTO toApplicationDTO(User user) {
        if (user == null) {
            return null;
        }

        return UserApplicationDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public UserResponse toResponse(UserApplicationDTO dto) {
        if (dto == null) {
            return null;
        }

        return UserResponse.builder()
                .id(dto.getId())
                .email(dto.getEmail())
                .fullName(dto.getFullName())
                .phoneNumber(dto.getPhoneNumber())
                .active(dto.getActive())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }

    public User toDomain(UserApplicationDTO dto) {
        if (dto == null) {
            return null;
        }

        return User.builder()
                .id(dto.getId())
                .email(dto.getEmail())
                .fullName(dto.getFullName())
                .phoneNumber(dto.getPhoneNumber())
                .active(dto.getActive())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }
}
