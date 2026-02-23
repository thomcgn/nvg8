// FILE: src/test/java/org/thomcgn/backend/common/security/ContextSecurityIntegrationTest.java

package org.thomcgn.backend.common.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.thomcgn.backend.testsupport.PostgresIntegrationTestBase;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContextSecurityIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;

    @Test
    void protectedEndpoint_withContextToken_isOk() throws Exception {
        String token = jwtService.issueContextToken(
                1L,                 // uid
                10L,                // tid
                20L,                // oid
                List.of("FACHKRAFT"),// roles (muss zu deiner Security passen)
                "test@example.com"
        );

        mockMvc.perform(get("/auth/context")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void protectedEndpoint_withBaseToken_isRejectedWithContextRequired() throws Exception {
        String token = jwtService.issueBaseToken(1L, "test@example.com");

        mockMvc.perform(get("/auth/context")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}