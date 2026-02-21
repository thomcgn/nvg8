package org.thomcgn.backend.people.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.people.model.Kind;

public interface KindRepository extends JpaRepository<Kind, Long> {}