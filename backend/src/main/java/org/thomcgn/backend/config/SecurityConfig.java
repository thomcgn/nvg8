package org.thomcgn.backend.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtFilter;

    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final String ROLE_TEAMLEITUNG = "ROLE_TEAMLEITUNG";
    private static final String ROLE_FACHKRAFT = "ROLE_FACHKRAFT";
    private static final String ROLE_IEFK = "ROLE_IEFK";
    private static final String ROLE_READ_ONLY = "ROLE_READ_ONLY";
    private static final String ROLE_DATENSCHUTZ = "ROLE_DATENSCHUTZBEAUFTRAGTER";

    private static final String[] READ_ALL = {
            ROLE_ADMIN, ROLE_TEAMLEITUNG, ROLE_FACHKRAFT, ROLE_IEFK, ROLE_READ_ONLY, ROLE_DATENSCHUTZ
    };

    private static final String[] CASE_WRITE = {
            ROLE_ADMIN, ROLE_TEAMLEITUNG, ROLE_FACHKRAFT
    };

    private static final String[] REPORT_READ = {
            ROLE_ADMIN, ROLE_TEAMLEITUNG, ROLE_IEFK, ROLE_DATENSCHUTZ
    };

    private static final String[] AUDIT_READ = {
            ROLE_ADMIN, ROLE_DATENSCHUTZ
    };

    public SecurityConfig(JwtAuthFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint((req, res, ex) -> {
                            log.warn("401 Unauthorized: {} {}", req.getMethod(), req.getRequestURI());
                            res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                        })
                        .accessDeniedHandler((req, res, ex) -> {
                            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                            log.warn("403 Forbidden: {} {}", req.getMethod(), req.getRequestURI());
                            if (auth == null) log.warn("403 details: auth=null");
                            else log.warn("403 details: principal={}, authorities={}", auth.getPrincipal(), auth.getAuthorities());
                            res.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Auth offen
                        .requestMatchers("/auth/**").permitAll()

                        // Admin User Management
                        .requestMatchers(HttpMethod.GET,   "/admin/users/**").hasAnyAuthority(READ_ALL)
                        .requestMatchers(HttpMethod.POST,  "/admin/users/**").hasAnyAuthority(ROLE_ADMIN, ROLE_TEAMLEITUNG)
                        .requestMatchers(HttpMethod.PATCH, "/admin/users/**").hasAnyAuthority(ROLE_ADMIN, ROLE_TEAMLEITUNG)
                        .requestMatchers("/admin/**").hasAnyAuthority(ROLE_ADMIN, ROLE_TEAMLEITUNG)

                        // Audit/Datenschutz
                        .requestMatchers("/audit/**", "/export/**", "/logs/**").hasAnyAuthority(AUDIT_READ)

                        // Reports/Statistik
                        .requestMatchers(HttpMethod.GET, "/reports/**", "/statistik/**").hasAnyAuthority(REPORT_READ)

                        // Standard-Read
                        .requestMatchers(HttpMethod.GET, "/kinder/**", "/faelle/**", "/dokumente/**", "/cases/**").hasAnyAuthority(READ_ALL)

                        // Write/Change
                        .requestMatchers(HttpMethod.POST,  "/kinder/**", "/faelle/**", "/dokumente/**", "/cases/**").hasAnyAuthority(CASE_WRITE)
                        .requestMatchers(HttpMethod.PATCH, "/kinder/**", "/faelle/**", "/dokumente/**", "/cases/**").hasAnyAuthority(CASE_WRITE)

                        // Delete restriktiv
                        .requestMatchers(HttpMethod.DELETE, "/kinder/**", "/faelle/**", "/dokumente/**", "/cases/**").hasAnyAuthority(ROLE_ADMIN)

                        .requestMatchers(HttpMethod.GET, "/facilities/public").permitAll()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
