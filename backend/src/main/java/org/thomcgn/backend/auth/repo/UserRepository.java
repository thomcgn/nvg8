package org.thomcgn.backend.auth.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.auth.data.Role;
import org.thomcgn.backend.auth.data.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    long countByRole(Role role);
    @Query("""
  select distinct u from User u
  left join fetch u.teams t
  where u.facility.id = :facilityId
""")
    List<User> findAllInFacilityWithTeams(@Param("facilityId") Long facilityId);
}
