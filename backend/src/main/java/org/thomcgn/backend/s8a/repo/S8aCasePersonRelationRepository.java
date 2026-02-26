package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.s8a.model.S8aCasePersonRelation;

import java.util.List;

public interface S8aCasePersonRelationRepository extends JpaRepository<S8aCasePersonRelation, Long> {
    List<S8aCasePersonRelation> findAllByS8aCaseIdOrderByCreatedAtAsc(Long s8aCaseId);
}