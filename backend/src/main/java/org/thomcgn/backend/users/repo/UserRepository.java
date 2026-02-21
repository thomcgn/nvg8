package org.thomcgn.backend.users.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.users.model.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    @Query("""
  select u from User u
  left join fetch u.orgRoles r
  left join fetch r.orgUnit ou
  left join fetch ou.traeger t
  where u.id = :id
""")
    Optional<User> findByIdWithOrgRoles(@Param("id") Long id);
}
