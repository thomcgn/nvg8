package org.thomcgn.backend.users.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.users.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    @Query("select u from User u where u.defaultTraeger.id = :traegerId and u.enabled = true order by u.nachname, u.vorname")
    List<User> findAllEnabledByTraegerId(@Param("traegerId") Long traegerId);
}
