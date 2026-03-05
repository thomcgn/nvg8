package org.thomcgn.backend.support.github.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class GitHubDtos {

    public record CreateIssueRequest(
            String title,
            String body,
            List<String> labels,
            List<String> assignees
    ) {}

    public record CreateIssueResponse(
            long id,
            int number,
            String title,
            String state,
            @JsonProperty("html_url") String htmlUrl
    ) {}
}