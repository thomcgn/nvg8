package org.thomcgn.backend.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
@EnableConfigurationProperties(JwtProperties.class)
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService, ObjectMapper objectMapper) throws Exception {
        JwtAuthFilter jwtAuthFilter = new JwtAuthFilter(jwtService,objectMapper);
        ContextRequiredFilter contextRequiredFilter = new ContextRequiredFilter();

        return http
                .cors(cors ->{})
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new ProblemAuthEntryPoint())
                        .accessDeniedHandler(new ProblemAccessDeniedHandler())
                )
                .authorizeHttpRequests(auth -> auth
                        // Public
                        .requestMatchers("/auth/login").permitAll()
                        .requestMatchers("/auth/logout").permitAll()
                        .requestMatchers("/auth/accept-invite").permitAll()
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()
                        // External/public share endpoints (falls wirklich öffentlich)
                        .requestMatchers("/external/share/download").permitAll()
                        .requestMatchers(("/external/share/download.pdf")).permitAll()
                        .requestMatchers("/external/**").authenticated()

                        // Context endpoints: authenticated (Base oder ctx Token reicht)
                        .requestMatchers("/auth/context").authenticated()
                        .requestMatchers("/auth/context/switch").authenticated()

                        // Legacy aliases (optional, falls du sie im Controller lässt)
                        .requestMatchers("/auth/contexts").authenticated()
                        .requestMatchers("/auth/switch-context").authenticated()

                        // Everything else requires authentication (und wird zusätzlich vom ContextRequiredFilter geschützt)
                        .anyRequest().authenticated()
                )
                // Reihenfolge: JWT zuerst, dann Context
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(contextRequiredFilter, JwtAuthFilter.class)
                .build();
    }
}