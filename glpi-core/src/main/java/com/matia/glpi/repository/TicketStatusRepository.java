package com.matia.glpi.repository;

import com.matia.glpi.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketStatusRepository extends JpaRepository<TicketStatus, Long> {
}
