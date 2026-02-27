package org.thomcgn.backend.falloeffnungen.risk.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungAnlass;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungAnlassId;

import java.util.List;

public interface FalleroeffnungAnlassRepository extends JpaRepository<FalleroeffnungAnlass, FalleroeffnungAnlassId> {

    @Query("""
           select a.code
           from FalleroeffnungAnlass a
           where a.falleroeffnung.id = :fallId
           """)
    List<String> findCodesByFallId(Long fallId);

    void deleteAllByFalleroeffnung_Id(Long fallId);
}