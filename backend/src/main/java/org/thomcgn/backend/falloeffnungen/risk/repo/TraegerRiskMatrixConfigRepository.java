package org.thomcgn.backend.falloeffnungen.risk.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.risk.model.TraegerRiskMatrixConfig;

import java.util.List;
import java.util.Optional;

public interface TraegerRiskMatrixConfigRepository extends JpaRepository<TraegerRiskMatrixConfig, Long> {

    @Query("""
           select c
           from TraegerRiskMatrixConfig c
           where c.traeger.id = :traegerId and c.active = true
           """)
    Optional<TraegerRiskMatrixConfig> findActiveByTraegerId(Long traegerId);

    @Query("""
           select c
           from TraegerRiskMatrixConfig c
           where c.traeger.id = :traegerId
           order by c.createdAt desc
           """)
    List<TraegerRiskMatrixConfig> findAllByTraegerIdOrderByCreatedAtDesc(Long traegerId);
}