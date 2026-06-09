package matia.glpicore.presentation.controller;

import lombok.extern.slf4j.Slf4j;
import matia.glpicore.application.dto.StatusApplicationDTO;
import matia.glpicore.application.service.StatusService;
import matia.glpicore.presentation.request.CreateStatusRequest;
import matia.glpicore.presentation.request.UpdateStatusRequest;
import matia.glpicore.presentation.response.StatusResponse;
import matia.glpicore.util.mapper.StatusMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/status")
@Slf4j
public class StatusController {

    private final StatusService statusService;
    private final StatusMapper statusMapper;

    public StatusController(StatusService statusService, StatusMapper statusMapper) {
        this.statusService = statusService;
        this.statusMapper = statusMapper;
    }

    @PostMapping
    public ResponseEntity<StatusResponse> createStatus(@RequestBody CreateStatusRequest request) {
        log.info("POST /status - Creating status: {}", request.getName());
        StatusApplicationDTO dto = statusService.createStatus(request);
        return new ResponseEntity<>(statusMapper.toResponse(dto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StatusResponse> getStatusById(@PathVariable Long id) {
        log.info("GET /status/{} - Fetching status", id);
        StatusApplicationDTO dto = statusService.getStatusById(id);
        return new ResponseEntity<>(statusMapper.toResponse(dto), HttpStatus.OK);
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<StatusResponse> getStatusByName(@PathVariable String name) {
        log.info("GET /status/name/{} - Fetching status by name", name);
        StatusApplicationDTO dto = statusService.getStatusByName(name);
        return new ResponseEntity<>(statusMapper.toResponse(dto), HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<StatusResponse>> getAllStatuses() {
        log.info("GET /status - Fetching all status");
        List<StatusResponse> responses = statusService.getAllStatuses().stream()
                .map(statusMapper::toResponse)
                .collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StatusResponse> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        log.info("PUT /status/{} - Updating status", id);
        StatusApplicationDTO dto = statusService.updateStatus(id, request);
        return new ResponseEntity<>(statusMapper.toResponse(dto), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStatus(@PathVariable Long id) {
        log.info("DELETE /status/{} - Deleting status", id);
        statusService.deleteStatus(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
