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
                .cors(cors -> {})
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/login").permitAll()
                        .requestMatchers("/auth/logout").permitAll()
                        .requestMatchers("/auth/accept-invite").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/external/share/download").permitAll()
                        .requestMatchers("/external/share/download.pdf").permitAll()
                        .requestMatchers("/external/**").authenticated()
                        .requestMatchers("/auth/context").authenticated()
                        .requestMatchers("/auth/context/switch").authenticated()
                        .requestMatchers("/auth/contexts").authenticated()
                        .requestMatchers("/auth/switch-context").authenticated()
                        .requestMatchers("/akten/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(contextRequiredFilter, JwtAuthFilter.class)
                .build();
    }
}