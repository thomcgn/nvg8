package org.thomcgn.backend.orgunits.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.orgunits.model.OrgUnit;

import java.util.List;

public interface OrgUnitRepository extends JpaRepository<OrgUnit, Long> {

    @Query("""
    select ou
    from OrgUnit ou
    join fetch ou.traeger t
    left join fetch ou.parent p
    where t.id = :traegerId
      and ou.enabled = true
      and t.enabled = true
  """)
    List<OrgUnit> findAllEnabledByTraegerId(@Param("traegerId") Long traegerId);
}