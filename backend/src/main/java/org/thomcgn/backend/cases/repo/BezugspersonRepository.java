package org.thomcgn.backend.cases.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.cases.model.Bezugsperson;

public interface BezugspersonRepository extends JpaRepository<Bezugsperson, Long> {
}
