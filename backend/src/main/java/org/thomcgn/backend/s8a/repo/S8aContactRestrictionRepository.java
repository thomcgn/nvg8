package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.s8a.model.S8aContactRestriction;

import java.util.List;

public interface S8aContactRestrictionRepository extends JpaRepository<S8aContactRestriction, Long> {
    List<S8aContactRestriction> findAllByS8aCaseIdOrderByCreatedAtAsc(Long s8aCaseId);
    List<S8aContactRestriction> findAllByS8aCaseIdAndChildPersonIdOrderByCreatedAtAsc(Long s8aCaseId, Long childPersonId);
}