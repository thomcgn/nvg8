package org.thomcgn.backend.people.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.people.model.Bezugsperson;

public interface BezugspersonRepository extends JpaRepository<Bezugsperson, Long> {

    // ---------------------------------------------------------
    // Pro Träger (alle Bezugspersonen im Tenant)
    // ---------------------------------------------------------
    @Query("""
      select b from Bezugsperson b
      where b.traegerId = :traegerId
        and (:q is null or :q = '' 
             or lower(b.vorname) like lower(concat('%', :q, '%'))
             or lower(b.nachname) like lower(concat('%', :q, '%'))
             or lower(b.kontaktEmail) like lower(concat('%', :q, '%'))
             or lower(b.telefon) like lower(concat('%', :q, '%'))
        )
      order by b.nachname asc, b.vorname asc
    """)
    Page<Bezugsperson> searchByTraeger(
            @Param("traegerId") Long traegerId,
            @Param("q") String q,
            Pageable pageable
    );

    // ---------------------------------------------------------
    // Optional: Pro Einrichtung (wenn du den Wizard enger scopen willst)
    // ---------------------------------------------------------
    @Query("""
      select b from Bezugsperson b
      where b.traegerId = :traegerId
        and b.ownerEinrichtungOrgUnitId = :einrichtungId
        and (:q is null or :q = '' 
             or lower(b.vorname) like lower(concat('%', :q, '%'))
             or lower(b.nachname) like lower(concat('%', :q, '%'))
             or lower(b.kontaktEmail) like lower(concat('%', :q, '%'))
             or lower(b.telefon) like lower(concat('%', :q, '%'))
        )
      order by b.nachname asc, b.vorname asc
    """)
    Page<Bezugsperson> searchByTraegerAndEinrichtung(
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId,
            @Param("q") String q,
            Pageable pageable
    );
}