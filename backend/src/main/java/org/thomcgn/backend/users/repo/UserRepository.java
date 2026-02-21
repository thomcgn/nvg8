package org.thomcgn.backend.users.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.users.model.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

}
