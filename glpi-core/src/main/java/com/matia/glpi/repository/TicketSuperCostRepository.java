package com.matia.glpi.repository;

import com.matia.glpi.entity.TicketSuperCost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketSuperCostRepository extends JpaRepository<TicketSuperCost, Long> {
}
