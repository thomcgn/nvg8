package org.thomcgn.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtFilter;
    private static final String[] READ_ALL = {
            "ADMIN", "TEAMLEITUNG", "FACHKRAFT", "IEFK", "READ_ONLY", "DATENSCHUTZBEAUFTRAGTER"
    };

    private static final String[] CASE_WRITE = {
            "ADMIN", "TEAMLEITUNG", "FACHKRAFT"
    };

    private static final String[] REPORT_READ = {
            "ADMIN", "TEAMLEITUNG", "IEFK", "DATENSCHUTZBEAUFTRAGTER"
    };

    private static final String[] AUDIT_READ = {
            "ADMIN", "DATENSCHUTZBEAUFTRAGTER"
    };

    public SecurityConfig(JwtAuthFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/auth/login", "/auth/logout").permitAll()

                        // Admin-only
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // Audit/Datenschutz
                        .requestMatchers("/audit/**", "/export/**", "/logs/**").hasAnyRole(AUDIT_READ)

                        // Reports / Statistik nur bestimmte Rollen
                        .requestMatchers(HttpMethod.GET, "/reports/**", "/statistik/**").hasAnyRole(REPORT_READ)

                        // Standard-Read auf fachliche Ressourcen
                        .requestMatchers(HttpMethod.GET, "/kinder/**", "/faelle/**", "/dokumente/**").hasAnyRole(READ_ALL)

                        // Write/Change fachliche Ressourcen
                        .requestMatchers(HttpMethod.POST, "/kinder/**", "/faelle/**", "/dokumente/**").hasAnyRole(CASE_WRITE)
                        .requestMatchers(HttpMethod.PATCH, "/kinder/**", "/faelle/**", "/dokumente/**").hasAnyRole(CASE_WRITE)

                        // Löschen restriktiv
                        .requestMatchers(HttpMethod.DELETE, "/kinder/**", "/faelle/**", "/dokumente/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
