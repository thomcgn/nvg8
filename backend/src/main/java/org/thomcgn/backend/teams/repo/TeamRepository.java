package org.thomcgn.backend.teams.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.team.model.Team;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByFacilityIdOrderByNameAsc(Long facilityId);
    Optional<Team> findByIdAndFacilityId(Long id, Long facilityId);
    boolean existsByFacilityIdAndNameIgnoreCase(Long facilityId, String name);
}