package com.matia.glpi.controller;

import com.matia.glpi.entity.TicketSuperCost;
import com.matia.glpi.repository.TicketSuperCostRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/super-cost")
public class TicketSuperCostController {
    private final TicketSuperCostRepository ticketSuperRepository;

    public TicketSuperCostController(TicketSuperCostRepository ticketSuperRepository) {
        this.ticketSuperRepository = ticketSuperRepository;
    }


    @GetMapping
    public ResponseEntity<?> getSuperCost() {
        return ResponseEntity.ok(ticketSuperRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> postStatus(@RequestBody TicketSuperCost status) {
        return ResponseEntity.ok(ticketSuperRepository.save(status));
    }

    

}
