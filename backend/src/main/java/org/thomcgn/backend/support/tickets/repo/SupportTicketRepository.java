package org.thomcgn.backend.support.tickets.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.support.tickets.model.SupportTicket;
import org.thomcgn.backend.support.tickets.model.SupportTicketStatus;

import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    List<SupportTicket> findByCreatedByUserIdOrderByCreatedAtDesc(Long userId);

    long countByCreatedByUserIdAndStatus(Long userId, SupportTicketStatus status);
    Optional<SupportTicket> findByGithubIssueNumber(long githubIssueNumber);
    // ✅ aus dem "github/repo" zusammengelegt
    List<SupportTicket> findByGithubIssueNumberIsNotNull();
}