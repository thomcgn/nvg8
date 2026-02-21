package org.thomcgn.backend.shares.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.shares.repo.CaseShareRequestRepository;

import java.time.Instant;

@Component
public class ShareCleanupJob {

    private final CaseShareRequestRepository repo;

    public ShareCleanupJob(CaseShareRequestRepository repo) {
        this.repo = repo;
    }

    @Scheduled(cron = "0 0 3 * * *") // täglich 03:00
    @Transactional
    public void expireOldRequests() {
        repo.expireOld(Instant.now());
    }
}