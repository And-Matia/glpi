package matia.glpicore.application.service;

import matia.glpicore.application.dto.ColorApplicationDTO;
import matia.glpicore.presentation.request.CreateColorRequest;
import matia.glpicore.presentation.request.UpdateColorRequest;

import java.util.List;

public interface ColorService {
    ColorApplicationDTO createColor(CreateColorRequest request);
    ColorApplicationDTO getColorById(Long id);
    ColorApplicationDTO getColorByName(String name);
    List<ColorApplicationDTO> getAllColors();
    ColorApplicationDTO updateColor(Long id, UpdateColorRequest request);
    void deleteColor(Long id);
}
