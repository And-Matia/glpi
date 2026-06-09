package matia.glpicore.presentation.controller;

import lombok.extern.slf4j.Slf4j;
import matia.glpicore.application.dto.ColorApplicationDTO;
import matia.glpicore.application.service.ColorService;
import matia.glpicore.presentation.request.CreateColorRequest;
import matia.glpicore.presentation.request.UpdateColorRequest;
import matia.glpicore.presentation.response.ColorResponse;
import matia.glpicore.util.mapper.ColorMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/colors")
@Slf4j
public class ColorController {

    private final ColorService colorService;
    private final ColorMapper colorMapper;

    public ColorController(ColorService colorService, ColorMapper colorMapper) {
        this.colorService = colorService;
        this.colorMapper = colorMapper;
    }

    @PostMapping
    public ResponseEntity<ColorResponse> createColor(@RequestBody CreateColorRequest request) {
        log.info("POST /colors - Creating color: {}", request.getName());
        ColorApplicationDTO dto = colorService.createColor(request);
        return new ResponseEntity<>(colorMapper.toResponse(dto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ColorResponse> getColorById(@PathVariable Long id) {
        log.info("GET /colors/{} - Fetching color", id);
        ColorApplicationDTO dto = colorService.getColorById(id);
        return new ResponseEntity<>(colorMapper.toResponse(dto), HttpStatus.OK);
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<ColorResponse> getColorByName(@PathVariable String name) {
        log.info("GET /colors/name/{} - Fetching color by name", name);
        ColorApplicationDTO dto = colorService.getColorByName(name);
        return new ResponseEntity<>(colorMapper.toResponse(dto), HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<ColorResponse>> getAllColors() {
        log.info("GET /colors - Fetching all colors");
        List<ColorResponse> responses = colorService.getAllColors().stream()
                .map(colorMapper::toResponse)
                .collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ColorResponse> updateColor(@PathVariable Long id, @RequestBody UpdateColorRequest request) {
        log.info("PUT /colors/{} - Updating color", id);
        ColorApplicationDTO dto = colorService.updateColor(id, request);
        return new ResponseEntity<>(colorMapper.toResponse(dto), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteColor(@PathVariable Long id) {
        log.info("DELETE /colors/{} - Deleting color", id);
        colorService.deleteColor(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
