package org.thomcgn.backend.cases.repo.kws;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.cases.model.kws.KwsRun;

import java.util.List;

public interface KwsRunRepo extends JpaRepository<KwsRun, Long> {
    @Query("""
    select r from KwsRun r
    where r.kind.id = :kindId
      and (:templateCode is null or r.template.code = :templateCode)
    order by r.createdAt desc
  """)
    List<KwsRun> findHistory(@Param("kindId") Long kindId, @Param("templateCode") String templateCode);
}
