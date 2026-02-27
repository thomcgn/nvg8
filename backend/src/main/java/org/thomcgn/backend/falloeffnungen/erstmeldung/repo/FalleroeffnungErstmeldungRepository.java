package org.thomcgn.backend.falloeffnungen.erstmeldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.falloeffnungen.erstmeldung.model.FalleroeffnungErstmeldung;

import java.util.List;
import java.util.Optional;

public interface FalleroeffnungErstmeldungRepository extends JpaRepository<FalleroeffnungErstmeldung, Long> {

    @Query("""
           select e
           from FalleroeffnungErstmeldung e
           where e.falleroeffnung.id = :fallId and e.current = true
           """)
    Optional<FalleroeffnungErstmeldung> findCurrentByFallId(Long fallId);

    @Query("""
           select e
           from FalleroeffnungErstmeldung e
           where e.falleroeffnung.id = :fallId
           order by e.versionNo desc
           """)
    List<FalleroeffnungErstmeldung> findAllVersionsByFallId(Long fallId);

    @Query("""
           select max(e.versionNo)
           from FalleroeffnungErstmeldung e
           where e.falleroeffnung.id = :fallId
           """)
    Integer findMaxVersionNo(Long fallId);
}