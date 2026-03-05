package org.thomcgn.backend.support.github.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.support.github.GithubClient;
import org.thomcgn.backend.support.github.GithubStatusMapper;
import org.thomcgn.backend.support.tickets.model.SupportTicket;
import org.thomcgn.backend.support.tickets.model.SupportTicketStatus;
import org.thomcgn.backend.support.tickets.repo.SupportTicketRepository;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupportTicketSyncService {

    private final GithubClient githubClient;
    private final SupportTicketRepository repo;

    public int syncAll() {

        List<SupportTicket> tickets =
                repo.findByGithubIssueNumberIsNotNull();

        int updated = 0;

        for (SupportTicket t : tickets) {

            Map issue = githubClient.getIssue(t.getGithubIssueNumber());

            List labels = (List) issue.get("labels");

            SupportTicketStatus newStatus =
                    GithubStatusMapper.statusFromLabels(labels);

            if (!newStatus.equals(t.getStatus())) {

                t.setStatus(newStatus);

                repo.save(t);

                updated++;
            }
        }

        return updated;
    }
}