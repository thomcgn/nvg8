package org.thomcgn.backend.cases.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.cases.model.KindBezugspersonRelation;

import java.util.List;

public interface KindBezugspersonRelationRepository extends JpaRepository<KindBezugspersonRelation, Long> {
    List<KindBezugspersonRelation> findByKind_Id(Long kindId);
}