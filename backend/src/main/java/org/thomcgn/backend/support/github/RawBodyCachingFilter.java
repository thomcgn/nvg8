package org.thomcgn.backend.support.github;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;

/**
 * Wraps ONLY the GitHub webhook request so we can read the raw body bytes
 * later for signature verification.
 */
@Component
public class RawBodyCachingFilter extends OncePerRequestFilter {

    // 1 MB cache should be plenty for GitHub issue webhooks
    private static final int CACHE_LIMIT_BYTES = 1024 * 1024;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/github/webhook");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        ContentCachingRequestWrapper wrappedRequest =
                new ContentCachingRequestWrapper(request, CACHE_LIMIT_BYTES);

        filterChain.doFilter(wrappedRequest, response);
    }
}