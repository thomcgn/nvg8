package org.thomcgn.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class GlobalCorsConfig {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${cors.allowed-methods}")
    private String allowedMethods;

    @Value("${cors.allow-credentials}")
    private boolean allowCredentials;

    @Bean
    public CorsFilter corsFilter() {

        CorsConfiguration config = new CorsConfiguration();

        // Wichtig bei Cookies!
        config.setAllowCredentials(allowCredentials);

        // Origins (Production Domain)
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .toList();
        config.setAllowedOriginPatterns(origins);

        // Methods
        List<String> methods = Arrays.stream(allowedMethods.split(","))
                .map(String::trim)
                .toList();
        config.setAllowedMethods(methods);

        // Headers
        config.addAllowedHeader("*");

        // Falls du Cookies zurückgibst
        config.addExposedHeader("Set-Cookie");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
