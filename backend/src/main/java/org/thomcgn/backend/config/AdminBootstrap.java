package org.thomcgn.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.thomcgn.backend.auth.data.Role;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.auth.repo.UserRepository;

@Configuration
public class AdminBootstrap {

    @Value("${app.bootstrapAdmin:false}")
    private boolean bootstrapAdmin;

    @Value("${app.bootstrapAdminEmail:admin@nvg8.de}")
    private String adminEmail;

    @Value("${app.bootstrapAdminPassword:}")
    private String adminPassword;

    @Bean
    public CommandLineRunner bootstrapAdminRunner(UserRepository repo, PasswordEncoder encoder) {
        return args -> {
            if (!bootstrapAdmin) {
                return; // in Prod normalerweise: false
            }

            if (adminPassword == null || adminPassword.isBlank()) {
                throw new IllegalStateException(
                        "app.bootstrapAdmin=true aber app.bootstrapAdminPassword ist leer. " +
                                "Setze ein starkes Passwort via ENV."
                );
            }

            // Existiert schon ein User mit der Email? -> nichts tun
            if (repo.findByEmail(adminEmail).isPresent()) {
                return;
            }

            User user = new User();
            user.setEmail(adminEmail);
            user.setPasswordHash(encoder.encode(adminPassword));
            user.setRole(Role.ADMIN);

            // Optional: Minimale Person-Daten
            user.setVorname("Admin");
            user.setNachname("NVG8");

            repo.save(user);

            System.out.println(">>> AdminBootstrap: Admin-User angelegt: " + adminEmail);
        };
    }
}
