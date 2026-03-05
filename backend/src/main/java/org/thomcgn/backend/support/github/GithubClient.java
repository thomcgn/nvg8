package org.thomcgn.backend.support.github;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class GithubClient {

    private final GithubProperties props;

    private RestClient client() {
        return RestClient.builder()
                .baseUrl("https://api.github.com/")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + props.token())
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .build();
    }

    public Map createIssue(Map body) {
        return client()
                .post()
                .uri("/repos/{owner}/{repo}/issues", props.owner(), props.repo())
                .body(body)
                .retrieve()
                .body(Map.class);
    }

    public Map getIssue(int number) {
        return client()
                .get()
                .uri("/repos/{owner}/{repo}/issues/{number}", props.owner(), props.repo(), number)
                .retrieve()
                .body(Map.class);
    }
}