package org.thomcgn.backend.people.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.people.model.Kind;

public interface KindRepository extends JpaRepository<Kind, Long> {

// ...

    @Query("""
    select k from Kind k
    where k.traegerId = :traegerId
      and k.ownerEinrichtungOrgUnitId = :einrichtungId
      and (
        :q is null
        or :q = ''
        or lower(concat(coalesce(k.vorname,''),' ',coalesce(k.nachname,''))) like lower(concat('%', :q, '%'))
      )
    order by k.nachname asc, k.vorname asc, k.id desc
""")
    Page<Kind> search(
            @Param("traegerId") Long traegerId,
            @Param("einrichtungId") Long einrichtungId,
            @Param("q") String q,
            Pageable pageable
    );
}