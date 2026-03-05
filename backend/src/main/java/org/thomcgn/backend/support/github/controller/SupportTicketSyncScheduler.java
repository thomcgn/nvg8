package org.thomcgn.backend.support.github.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.support.github.service.SupportTicketSyncService;


@Service
@RequiredArgsConstructor
public class SupportTicketSyncScheduler {

    private final SupportTicketSyncService syncService;

    @Scheduled(fixedDelayString = "${support.syncDelayMs:60000}")
    public void run() {
        syncService.syncAll();
    }
}