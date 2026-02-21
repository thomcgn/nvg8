package org.thomcgn.backend.people.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.people.model.FallBeteiligter;

import java.util.List;

public interface FallBeteiligterRepository extends JpaRepository<FallBeteiligter, Long> {
    List<FallBeteiligter> findAllByFallIdOrderByCreatedAtAsc(Long fallId);
}