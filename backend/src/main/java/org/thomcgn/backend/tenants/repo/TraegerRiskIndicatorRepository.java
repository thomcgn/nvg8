package org.thomcgn.backend.tenants.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.thomcgn.backend.tenants.model.TraegerRiskIndicator;

import java.util.List;
import java.util.Optional;

public interface TraegerRiskIndicatorRepository extends JpaRepository<TraegerRiskIndicator, Long> {

    List<TraegerRiskIndicator> findAllByTraeger_IdOrderBySortOrderAscIdAsc(Long traegerId);

    Optional<TraegerRiskIndicator> findByTraeger_IdAndId(Long traegerId, Long id);

    Optional<TraegerRiskIndicator> findByTraeger_IdAndIndicatorId(Long traegerId, String indicatorId);

    @Query("select coalesce(max(t.sortOrder), 0) from TraegerRiskIndicator t where t.traeger.id = :traegerId")
    int maxSortOrder(Long traegerId);
}