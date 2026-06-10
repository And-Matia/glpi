package com.matia.glpi.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
public class TicketStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String color;
    @OneToMany(mappedBy = "status", cascade = CascadeType.ALL)
    private List<TicketStatusName> names;
}
