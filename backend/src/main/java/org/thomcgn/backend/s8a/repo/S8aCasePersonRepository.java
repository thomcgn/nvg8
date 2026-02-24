package org.thomcgn.backend.s8a.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.s8a.model.S8aCasePerson;

import java.util.List;

public interface S8aCasePersonRepository extends JpaRepository<S8aCasePerson, Long> {
    List<S8aCasePerson> findAllByS8aCaseIdOrderByIdAsc(Long s8aCaseId);
}