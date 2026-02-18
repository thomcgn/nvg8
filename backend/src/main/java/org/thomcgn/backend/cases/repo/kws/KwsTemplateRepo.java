package org.thomcgn.backend.cases.repo.kws;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.cases.model.kws.KwsTemplate;

import java.util.List;
import java.util.Optional;

public interface KwsTemplateRepo extends JpaRepository<KwsTemplate, Long> {
    Optional<KwsTemplate> findByCode(String code);

    @Query("""
    select t from KwsTemplate t
    where t.active = true
      and (:months is null or ( (t.minAgeMonths is null or t.minAgeMonths <= :months)
                            and (t.maxAgeMonths is null or t.maxAgeMonths >= :months) ))
  """)
    List<KwsTemplate> findApplicable(@Param("months") Integer months);
}

