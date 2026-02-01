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
                user.setEmail("admin@nvg8.de");
                user.setPasswordHash(encoder.encode("admin"));
                user.setRole(Role.ADMIN);

                // Person-Daten
                user.setVorname("Tom");
                user.setNachname("Kramer");
                user.setStrasse("Musterstraße");
                user.setHausnummer("12A");
                user.setPlz("12345");
                user.setOrt("Köln");
                user.setTelefon("01234/56789");

                repo.save(user);

            }
        };
    }
}
