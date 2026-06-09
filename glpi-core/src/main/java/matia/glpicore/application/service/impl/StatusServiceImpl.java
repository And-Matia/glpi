package matia.glpicore.application.service.impl;

import lombok.extern.slf4j.Slf4j;
import matia.glpicore.application.dto.StatusApplicationDTO;
import matia.glpicore.application.service.StatusService;
import matia.glpicore.domain.entity.Status;
import matia.glpicore.exception.DuplicateResourceException;
import matia.glpicore.exception.ResourceNotFoundException;
import matia.glpicore.infrastructure.repository.StatusRepository;
import matia.glpicore.presentation.request.CreateStatusRequest;
import matia.glpicore.presentation.request.UpdateStatusRequest;
import matia.glpicore.util.mapper.StatusMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class StatusServiceImpl implements StatusService {

    private final StatusRepository statusRepository;
    private final StatusMapper statusMapper;

    public StatusServiceImpl(StatusRepository statusRepository, StatusMapper statusMapper) {
        this.statusRepository = statusRepository;
        this.statusMapper = statusMapper;
    }

    @Override
    public StatusApplicationDTO createStatus(CreateStatusRequest request) {
        log.info("Creating status with name: {}", request.getName());
        if (statusRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Status with name '" + request.getName() + "' already exists");
        }
        Status status = Status.builder()
                .name(request.getName())
                .malgacheName(request.getMalgacheName())
                .build();
        Status saved = statusRepository.save(status);
        log.info("Status created with id: {}", saved.getId());
        return statusMapper.toApplicationDTO(saved);
    }

    @Override
    public StatusApplicationDTO getStatusById(Long id) {
        log.info("Fetching status with id: {}", id);
        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Status not found with id: " + id));
        return statusMapper.toApplicationDTO(status);
    }

    @Override
    public StatusApplicationDTO getStatusByName(String name) {
        log.info("Fetching status with name: {}", name);
        Status status = statusRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Status not found with name: " + name));
        return statusMapper.toApplicationDTO(status);
    }

    @Override
    public List<StatusApplicationDTO> getAllStatuses() {
        log.info("Fetching all statuses");
        return statusRepository.findAll().stream()
                .map(statusMapper::toApplicationDTO)
                .collect(Collectors.toList());
    }

    @Override
    public StatusApplicationDTO updateStatus(Long id, UpdateStatusRequest request) {
        log.info("Updating status with id: {}", id);
        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Status not found with id: " + id));
        if (request.getMalgacheName() != null) {
            status.setMalgacheName(request.getMalgacheName());
        }
        Status updated = statusRepository.save(status);
        log.info("Status updated with id: {}", id);
        return statusMapper.toApplicationDTO(updated);
    }

    @Override
    public void deleteStatus(Long id) {
        log.info("Deleting status with id: {}", id);
        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Status not found with id: " + id));
        statusRepository.delete(status);
        log.info("Status deleted with id: {}", id);
    }
}
