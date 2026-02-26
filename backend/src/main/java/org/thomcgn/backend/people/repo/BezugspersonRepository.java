package org.thomcgn.backend.people.repo;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.people.model.Bezugsperson;

import java.util.List;

public interface BezugspersonRepository extends JpaRepository<Bezugsperson, Long> {

    @Query("""
        select b from Bezugsperson b
        where (:q is null or :q = '' 
              or lower(b.vorname) like lower(concat('%', :q, '%'))
              or lower(b.nachname) like lower(concat('%', :q, '%'))
              or lower(coalesce(b.kontaktEmail,'')) like lower(concat('%', :q, '%'))
              or lower(coalesce(b.telefon,'')) like lower(concat('%', :q, '%')))
        order by b.nachname asc, b.vorname asc, b.id asc
    """)
    List<Bezugsperson> search(@Param("q") String q, Pageable pageable);
}