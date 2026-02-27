package org.thomcgn.backend.falloeffnungen.risk.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungRiskSnapshot;

import java.util.List;
import java.util.Optional;

public interface FalleroeffnungRiskSnapshotRepository extends JpaRepository<FalleroeffnungRiskSnapshot, Long> {

    @Query("""
           select s
           from FalleroeffnungRiskSnapshot s
           where s.falleroeffnung.id = :fallId
           order by s.createdAt desc
           """)
    List<FalleroeffnungRiskSnapshot> findHistory(Long fallId);

    @Query("""
           select s
           from FalleroeffnungRiskSnapshot s
           where s.falleroeffnung.id = :fallId
           order by s.createdAt desc
           """)
    List<FalleroeffnungRiskSnapshot> findTop1ByFallIdOrderByCreatedAtDesc(Long fallId);

    default Optional<FalleroeffnungRiskSnapshot> findLatest(Long fallId) {
        List<FalleroeffnungRiskSnapshot> list = findTop1ByFallIdOrderByCreatedAtDesc(fallId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}