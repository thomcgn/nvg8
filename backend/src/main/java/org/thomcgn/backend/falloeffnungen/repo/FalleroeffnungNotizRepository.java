package org.thomcgn.backend.falloeffnungen.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.falloeffnungen.model.FalleroeffnungNotiz;

import java.util.List;

public interface FalleroeffnungNotizRepository extends JpaRepository<FalleroeffnungNotiz, Long> {
    List<FalleroeffnungNotiz> findAllByFalleroeffnungIdOrderByCreatedAtAsc(Long falleroeffnungId);
}