package org.thomcgn.backend.support.tickets.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.support.tickets.model.SupportTicket;
import org.thomcgn.backend.support.tickets.model.SupportTicketStatus;

import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    Optional<SupportTicket> findByGithubIssueNumber(Integer githubIssueNumber);

    // ✅ neu: Liste "meine Tickets"
    List<SupportTicket> findByCreatedByUserIdOrderByCreatedAtDesc(Long createdByUserId);

    // ✅ neu: Count (z.B. OPEN)
    long countByCreatedByUserIdAndStatus(Long createdByUserId, SupportTicketStatus status);
}