package org.thomcgn.backend.cases.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.cases.model.KinderschutzFall;

public interface KinderschutzFallRepository extends JpaRepository<KinderschutzFall, Long> {
}
