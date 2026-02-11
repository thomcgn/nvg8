package org.thomcgn.backend.auth.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.auth.data.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
