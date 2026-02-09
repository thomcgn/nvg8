package org.thomcgn.backend.cases.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.cases.model.Kind;

public interface KindRepository extends JpaRepository<Kind, Long> {
}
