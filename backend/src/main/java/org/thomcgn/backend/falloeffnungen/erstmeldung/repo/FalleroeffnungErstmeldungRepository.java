// src/main/java/org/thomcgn/backend/falloeffnungen/erstmeldung/repo/FalleroeffnungErstmeldungRepository.java
package org.thomcgn.backend.falloeffnungen.erstmeldung.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.falloeffnungen.erstmeldung.model.FalleroeffnungErstmeldung;

import java.util.List;
import java.util.Optional;

public interface FalleroeffnungErstmeldungRepository extends JpaRepository<FalleroeffnungErstmeldung, Long> {

    @Query("""
           select e
           from FalleroeffnungErstmeldung e
           where e.falleroeffnung.id = :fallId and e.current = true
           """)
    Optional<FalleroeffnungErstmeldung> findCurrentByFallId(@Param("fallId") Long fallId);

    @Query("""
           select e
           from FalleroeffnungErstmeldung e
           where e.falleroeffnung.id = :fallId
           order by e.versionNo desc
           """)
    List<FalleroeffnungErstmeldung> findAllVersionsByFallId(@Param("fallId") Long fallId);

    @Query("""
           select max(e.versionNo)
           from FalleroeffnungErstmeldung e
           where e.falleroeffnung.id = :fallId
           """)
    Integer findMaxVersionNo(@Param("fallId") Long fallId);

    @Modifying
    @Query("""
           update FalleroeffnungErstmeldung e
           set e.current = false
           where e.falleroeffnung.id = :fallId and e.current = true
           """)
    int clearCurrentByFallId(@Param("fallId") Long fallId);

    // ✅ NEU: alle current=false setzen, aber eine ID behalten
    @Modifying
    @Query("""
           update FalleroeffnungErstmeldung e
           set e.current = false
           where e.falleroeffnung.id = :fallId
             and e.current = true
             and e.id <> :keepId
           """)
    int clearCurrentByFallIdExcept(@Param("fallId") Long fallId, @Param("keepId") Long keepId);

    Optional<FalleroeffnungErstmeldung> findTopByFalleroeffnung_IdOrderByVersionNoDesc(Long fallId);
}