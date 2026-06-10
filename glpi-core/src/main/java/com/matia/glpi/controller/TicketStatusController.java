package com.matia.glpi.controller;

import com.matia.glpi.entity.TicketStatus;
import com.matia.glpi.repository.TicketStatusRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tickets/status")
public class TicketStatusController {
    private final TicketStatusRepository ticketStatusRepository;

    public TicketStatusController(TicketStatusRepository ticketStatusRepository) {
        this.ticketStatusRepository = ticketStatusRepository;
    }

    @GetMapping
    public ResponseEntity<?> getStatus() {
        return ResponseEntity.ok(ticketStatusRepository.findAll());
    }
    
    @PutMapping
    public ResponseEntity<?> putStatus(@RequestBody TicketStatus status) {
        status.getNames().forEach(name -> name.setStatus(status));
        return ResponseEntity.ok(ticketStatusRepository.save(status));
    }

    @PostMapping
    public ResponseEntity<?> postStatus(@RequestBody TicketStatus status) {
        status.getNames().forEach(name -> name.setStatus(status));
        return ResponseEntity.ok(ticketStatusRepository.save(status));
    }
}
