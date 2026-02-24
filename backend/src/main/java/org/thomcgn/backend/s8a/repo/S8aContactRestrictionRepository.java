package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.s8a.model.S8aContactRestriction;

import java.util.List;
import java.util.Optional;

public interface S8aContactRestrictionRepository extends JpaRepository<S8aContactRestriction, Long> {
    List<S8aContactRestriction> findAllByS8aCaseIdOrderByCreatedAtAsc(Long s8aCaseId);
    List<S8aContactRestriction> findAllByS8aCaseIdAndChildPersonIdOrderByCreatedAtAsc(Long s8aCaseId, Long childPersonId);
    Optional<S8aContactRestriction> findTopByS8aCaseIdAndChildPersonIdAndOtherPersonIdOrderByCreatedAtDesc(
            Long s8aCaseId, Long childPersonId, Long otherPersonId
    );

    List<S8aContactRestriction> findAllByS8aCaseIdAndChildPersonIdAndOtherPersonIdOrderByCreatedAtDesc(
            Long s8aCaseId, Long childPersonId, Long otherPersonId
    );

    java.util.Optional<S8aContactRestriction> findByIdAndS8aCaseId(Long id, Long s8aCaseId);

    List<S8aContactRestriction> findAllByS8aCaseIdAndSupersedesIdOrderByCreatedAtAsc(Long s8aCaseId, Long supersedesId);
}