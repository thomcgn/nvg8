package org.thomcgn.backend.auth;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.thomcgn.backend.auth.data.Role;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.auth.repositories.UserRepository;

@Component
public class DevUserInitializer {

    @Bean
    CommandLineRunner init(UserRepository repo, PasswordEncoder encoder) {
        return args -> {
            if (repo.count() == 0) {
                User user = new User();
                user.setEmail("fachkraft@test.de");
                user.setPasswordHash(encoder.encode("test123"));
                user.setRole(Role.FACHKRAFT);
                repo.save(user);
                System.out.println("✅ Dev-User angelegt: fachkraft@test.de / test123");
            }
        };
    }
}
