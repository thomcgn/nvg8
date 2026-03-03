package org.thomcgn.backend.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.Customizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@EnableConfigurationProperties(JwtProperties.class)
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtService jwtService,
            ObjectMapper objectMapper,
            ProblemAuthEntryPoint authEntryPoint,
            ProblemAccessDeniedHandler accessDeniedHandler
    ) throws Exception {

        JwtAuthFilter jwtAuthFilter = new JwtAuthFilter(jwtService, objectMapper);
        ContextRequiredFilter contextRequiredFilter = new ContextRequiredFilter(objectMapper);

        return http
                // ✅ CORS aktivieren (nutzt deine CorsConfigurationSource Bean)
                .cors(Customizer.withDefaults())

                // ✅ Kein CSRF (API + JWT)
                .csrf(csrf -> csrf.disable())

                // ✅ Stateless (kein Session-Cookie)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ✅ Exception Handling
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )

                // ✅ Authorization Regeln
                .authorizeHttpRequests(auth -> auth

                        // 🔥 Wichtig: Preflight erlauben
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public Endpoints
                        .requestMatchers("/auth/login").permitAll()
                        .requestMatchers("/auth/logout").permitAll()
                        .requestMatchers("/auth/accept-invite").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()

                        // Geschützte Bereiche
                        .requestMatchers("/auth/**").authenticated()
                        .requestMatchers("/external/**").authenticated()
                        .requestMatchers("/akten/**").authenticated()

                        .anyRequest().authenticated()
                )

                // JWT Filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(contextRequiredFilter, JwtAuthFilter.class)

                .build();
    }
}