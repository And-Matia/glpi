package matia.glpicore.application.service.impl;

import lombok.extern.slf4j.Slf4j;
import matia.glpicore.application.dto.ColorApplicationDTO;
import matia.glpicore.application.service.ColorService;
import matia.glpicore.domain.entity.Color;
import matia.glpicore.exception.DuplicateResourceException;
import matia.glpicore.exception.ResourceNotFoundException;
import matia.glpicore.infrastructure.repository.ColorRepository;
import matia.glpicore.presentation.request.CreateColorRequest;
import matia.glpicore.presentation.request.UpdateColorRequest;
import matia.glpicore.util.mapper.ColorMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class ColorServiceImpl implements ColorService {

    private final ColorRepository colorRepository;
    private final ColorMapper colorMapper;

    public ColorServiceImpl(ColorRepository colorRepository, ColorMapper colorMapper) {
        this.colorRepository = colorRepository;
        this.colorMapper = colorMapper;
    }

    @Override
    public ColorApplicationDTO createColor(CreateColorRequest request) {
        log.info("Creating color with name: {}", request.getName());
        if (colorRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Color with name '" + request.getName() + "' already exists");
        }
        Color color = Color.builder()
                .name(request.getName())
                .hexValue(request.getHexValue())
                .build();
        Color saved = colorRepository.save(color);
        log.info("Color created with id: {}", saved.getId());
        return colorMapper.toApplicationDTO(saved);
    }

    @Override
    public ColorApplicationDTO getColorById(Long id) {
        log.info("Fetching color with id: {}", id);
        Color color = colorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Color not found with id: " + id));
        return colorMapper.toApplicationDTO(color);
    }

    @Override
    public ColorApplicationDTO getColorByName(String name) {
        log.info("Fetching color with name: {}", name);
        Color color = colorRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Color not found with name: " + name));
        return colorMapper.toApplicationDTO(color);
    }

    @Override
    public List<ColorApplicationDTO> getAllColors() {
        log.info("Fetching all colors");
        return colorRepository.findAll().stream()
                .map(colorMapper::toApplicationDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ColorApplicationDTO updateColor(Long id, UpdateColorRequest request) {
        log.info("Updating color with id: {}", id);
        Color color = colorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Color not found with id: " + id));
        if (request.getHexValue() != null) {
            color.setHexValue(request.getHexValue());
        }
        Color updated = colorRepository.save(color);
        log.info("Color updated with id: {}", id);
        return colorMapper.toApplicationDTO(updated);
    }

    @Override
    public void deleteColor(Long id) {
        log.info("Deleting color with id: {}", id);
        Color color = colorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Color not found with id: " + id));
        colorRepository.delete(color);
        log.info("Color deleted with id: {}", id);
    }
}
