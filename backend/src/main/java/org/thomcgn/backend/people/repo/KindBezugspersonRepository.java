package org.thomcgn.backend.people.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.people.model.KindBezugsperson;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface KindBezugspersonRepository extends JpaRepository<KindBezugsperson, Long> {

    /**
     * Liefert alle aktiven Bezugspersonen eines Kindes zum angegebenen Stichtag.
     *
     * Aktiv bedeutet:
     * - validFrom <= :date
     * - validTo ist null ODER validTo >= :date
     * - enabled = true
     */
    @Query("""
        select distinct kbp
        from KindBezugsperson kbp
        join fetch kbp.bezugsperson
        join fetch kbp.kind k
        where k.id = :kindId
          and kbp.validFrom <= :date
          and (kbp.validTo is null or kbp.validTo >= :date)
          and kbp.enabled = true
        """)
    List<KindBezugsperson> findActiveByKindId(
            @Param("kindId") Long kindId,
            @Param("date") LocalDate date
    );

    /**
     * Liefert alle Bezugspersonen eines Kindes (ohne Aktiv-Filter).
     */
    @Query("""
        select distinct kbp
        from KindBezugsperson kbp
        join fetch kbp.bezugsperson
        join fetch kbp.kind k
        where k.id = :kindId
        """)
    List<KindBezugsperson> findByKindId(@Param("kindId") Long kindId);

    /**
     * Eine konkrete Beziehung innerhalb eines Kindes laden.
     */
    Optional<KindBezugsperson> findByIdAndKindId(Long id, Long kindId);
}