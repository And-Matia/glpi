package matia.glpicore.util.mapper;

import matia.glpicore.application.dto.StatusApplicationDTO;
import matia.glpicore.domain.entity.Status;
import matia.glpicore.presentation.response.StatusResponse;
import org.springframework.stereotype.Component;

@Component
public class StatusMapper {

    public StatusApplicationDTO toApplicationDTO(Status status) {
        return StatusApplicationDTO.builder()
                .id(status.getId())
                .name(status.getName())
                .malgacheName(status.getMalgacheName())
                .build();
    }

    public StatusResponse toResponse(StatusApplicationDTO dto) {
        return StatusResponse.builder()
                .id(dto.getId())
                .name(dto.getName())
                .malgacheName(dto.getMalgacheName())
                .build();
    }
}
