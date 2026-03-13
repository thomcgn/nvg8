package org.thomcgn.backend.schutzplan.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.schutzplan.model.SchutzplanMassnahme;

import java.util.List;

public interface SchutzplanMassnahmeRepository extends JpaRepository<SchutzplanMassnahme, Long> {

    List<SchutzplanMassnahme> findBySchutzplan_IdOrderByPosition(Long schutzplanId);

    @Modifying
    @Query("delete from SchutzplanMassnahme m where m.schutzplan.id = :schutzplanId")
    void deleteBySchutzplanId(@Param("schutzplanId") Long schutzplanId);
}
