package com.matia.glpi.controller;

import com.matia.glpi.entity.TicketSuperCost;
import com.matia.glpi.repository.TicketSuperCostRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tickets/super-costs")
public class TicketSuperCostController {
    private final TicketSuperCostRepository ticketSuperCostRepository;

    public TicketSuperCostController(TicketSuperCostRepository ticketSuperCostRepository) {
        this.ticketSuperCostRepository = ticketSuperCostRepository;
    }

    @PostMapping
    public ResponseEntity<?> postCost(@RequestBody TicketSuperCost cost) {
        return ResponseEntity.ok(ticketSuperCostRepository.save(cost));
    }
    
    @GetMapping
    public ResponseEntity<?> getCosts() {
        return ResponseEntity.ok(ticketSuperCostRepository.findAll());
    }
}
