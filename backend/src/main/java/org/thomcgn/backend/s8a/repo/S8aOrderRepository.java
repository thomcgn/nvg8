package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.s8a.model.S8aOrder;

import java.util.List;

public interface S8aOrderRepository extends JpaRepository<S8aOrder, Long> {
    List<S8aOrder> findAllByS8aCaseIdOrderByCreatedAtAsc(Long s8aCaseId);
}