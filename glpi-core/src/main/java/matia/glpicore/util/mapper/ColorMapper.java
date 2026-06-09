package matia.glpicore.util.mapper;

import matia.glpicore.application.dto.ColorApplicationDTO;
import matia.glpicore.domain.entity.Color;
import matia.glpicore.presentation.response.ColorResponse;
import org.springframework.stereotype.Component;

@Component
public class ColorMapper {

    public ColorApplicationDTO toApplicationDTO(Color color) {
        return ColorApplicationDTO.builder()
                .id(color.getId())
                .name(color.getName())
                .hexValue(color.getHexValue())
                .build();
    }

    public ColorResponse toResponse(ColorApplicationDTO dto) {
        return ColorResponse.builder()
                .id(dto.getId())
                .name(dto.getName())
                .hexValue(dto.getHexValue())
                .build();
    }
}
