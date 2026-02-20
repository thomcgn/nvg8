package org.thomcgn.backend.facility.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.facility.model.Facility;

public interface FacilityRepository extends JpaRepository<Facility, Long> {}
