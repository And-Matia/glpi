package matia.glpicore.application.service;

import matia.glpicore.application.dto.StatusApplicationDTO;
import matia.glpicore.presentation.request.CreateStatusRequest;
import matia.glpicore.presentation.request.UpdateStatusRequest;

import java.util.List;

public interface StatusService {
    StatusApplicationDTO createStatus(CreateStatusRequest request);
    StatusApplicationDTO getStatusById(Long id);
    StatusApplicationDTO getStatusByName(String name);
    List<StatusApplicationDTO> getAllStatuses();
    StatusApplicationDTO updateStatus(Long id, UpdateStatusRequest request);
    void deleteStatus(Long id);
}
