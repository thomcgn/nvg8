package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.s8a.model.S8aEvent;

import java.util.List;

public interface S8aEventRepository extends JpaRepository<S8aEvent, Long> {
    List<S8aEvent> findAllByS8aCaseIdOrderByCreatedAtAsc(Long s8aCaseId);
}