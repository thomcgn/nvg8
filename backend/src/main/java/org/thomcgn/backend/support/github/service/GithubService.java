package org.thomcgn.backend.support.github.service;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.thomcgn.backend.support.github.GithubProperties;

import java.util.List;
import java.util.Map;

@Service
public class GithubService {

    private final GithubProperties props;
    private final RestClient client;

    public GithubService(GithubProperties props) {
        this.props = props;
        this.client = RestClient.builder()
                .baseUrl("https://api.github.com")
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("Authorization", "Bearer " + props.token())
                .build();
    }

    @SuppressWarnings("unchecked")
    public CreatedIssue createIssue(String title, String body, List<String> labels) {
        if (props.token() == null || props.token().isBlank()) {
            throw new IllegalStateException("github.token is missing (set GITHUB_TOKEN)");
        }
        if (props.owner() == null || props.owner().isBlank() || props.repo() == null || props.repo().isBlank()) {
            throw new IllegalStateException("github.owner/repo missing (set GITHUB_OWNER/GITHUB_REPO)");
        }

        Map<String, Object> payload = Map.of(
                "title", title,
                "body", body,
                "labels", labels
        );

        Map<String, Object> res = client.post()
                .uri("/repos/{owner}/{repo}/issues", props.owner(), props.repo())
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(Map.class);

        Integer number = ((Number) res.get("number")).intValue();
        String url = (String) res.get("html_url");
        return new CreatedIssue(number, url);
    }

    public record CreatedIssue(Integer number, String url) {}
}