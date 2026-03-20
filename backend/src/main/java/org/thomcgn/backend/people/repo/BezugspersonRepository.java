package org.thomcgn.backend.people.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.people.model.Bezugsperson;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BezugspersonRepository extends JpaRepository<Bezugsperson, Long> {

    // ---------------------------------------------------------
    // Pro Träger (alle nicht-gelöschten Bezugspersonen im Tenant)
    // ---------------------------------------------------------
    @Query(
        value = """
          select b from Bezugsperson b
          where b.traegerId = :traegerId
            and b.deletedAt is null
            and (:q is null or :q = ''
                 or lower(b.vorname) like lower(concat('%', :q, '%'))
                 or lower(b.nachname) like lower(concat('%', :q, '%'))
                 or lower(b.kontaktEmail) like lower(concat('%', :q, '%'))
                 or lower(b.telefon) like lower(concat('%', :q, '%'))
             )
          order by b.nachname asc, b.vorname asc
        """,
        countQuery = """
          select count(b) from Bezugsperson b
          where b.traegerId = :traegerId
            and b.deletedAt is null
            and (:q is null or :q = ''
                 or lower(b.vorname) like lower(concat('%', :q, '%'))
                 or lower(b.nachname) like lower(concat('%', :q, '%'))
                 or lower(b.kontaktEmail) like lower(concat('%', :q, '%'))
                 or lower(b.telefon) like lower(concat('%', :q, '%'))
             )
        """
    )
    Page<Bezugsperson> searchByTraeger(
            @Param("traegerId") Long traegerId,
            @Param("q") String q,
            Pageable pageable
    );

    // ---------------------------------------------------------
    // Optional: Pro Einrichtung (wenn du den Wizard enger scopen willst)
    // ---------------------------------------------------------
    @Query(
        value = """
          select b from Bezugsperson b
          where b.traegerId = :traegerId
            and b.ownerEinrichtungOrgUnitId = :einrichtungId
            and b.deletedAt is null
            and (:q is null or :q = ''
                 or lower(b.vorname) like lower(concat('%', :q, '%'))
                 or lower(b.nachname) like lower(concat('%', :q, '%'))
                 or lower(b.kontaktEmail) like lower(concat('%', :q, '%'))
                 or lower(b.telefon) like lower(concat('%', :q, '%'))
             )
          order by b.nachname asc, b.vorname asc
        """,
        countQuery = """
          select count(b) from Bezugsperson b
          where b.traegerId = :traegerId
            and b.ownerEinrichtungOrgUnitId = :einrichtungId
            and b.deletedAt is null
            and (:q is null or :q = ''
                 or lower(b.vorname) like lower(concat('%', :q, '%'))
                 or lower(b.nachname) like lower(concat('%', :q, '%'))
                 or lower(b.kontaktEmail) like lower(concat('%', :q, '%'))
                 or lower(b.telefon) like lower(concat('%', :q, '%'))
             )
        """
    )
    Page<Bezugsperson> searchByTraegerAndEinrichtung(
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId,
            @Param("q") String q,
            Pageable pageable
    );

    @Query("""
  select bp
  from Bezugsperson bp
  where lower(bp.vorname) = lower(:vorname)
    and lower(bp.nachname) = lower(:nachname)
    and bp.geburtsdatum = :geburtsdatum
    and bp.deletedAt is null
""")
    List<Bezugsperson> findDuplicates(
            @Param("vorname") String vorname,
            @Param("nachname") String nachname,
            @Param("geburtsdatum") LocalDate geburtsdatum
    );

    /**
     * Loads by id only if not soft-deleted (for normal read operations).
     */
    @Query("select b from Bezugsperson b where b.id = :id and b.deletedAt is null")
    Optional<Bezugsperson> findActiveById(@Param("id") Long id);
}
