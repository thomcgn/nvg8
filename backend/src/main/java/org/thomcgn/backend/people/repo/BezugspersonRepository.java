package org.thomcgn.backend.people.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.people.model.Bezugsperson;

public interface BezugspersonRepository extends JpaRepository<Bezugsperson, Long> {}