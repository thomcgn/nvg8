package org.thomcgn.backend.support.github;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.thomcgn.backend.support.github.dto.GitHubDtos.CreateIssueRequest;
import static org.thomcgn.backend.support.github.dto.GitHubDtos.CreateIssueResponse;

public class GitHubIssueClient {

    private final RestClient client;
    private final String owner;
    private final String repo;

    public GitHubIssueClient(String baseUrl, String token, String owner, String repo) {
        this.owner = owner;
        this.repo = repo;

        this.client = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .build();
    }

    public CreateIssueResponse createIssue(String title, String body, List<String> labels, List<String> assignees) {
        return client.post()
                .uri("/repos/{owner}/{repo}/issues", owner, repo)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CreateIssueRequest(title, body, labels, assignees))
                .retrieve()
                .body(CreateIssueResponse.class);
    }
}