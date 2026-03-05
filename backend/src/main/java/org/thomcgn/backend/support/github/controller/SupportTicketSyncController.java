package org.thomcgn.backend.support.github.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.thomcgn.backend.support.github.service.SupportTicketSyncService;

import java.util.Map;

@RestController
@RequestMapping("/support/tickets")
@RequiredArgsConstructor
public class SupportTicketSyncController {

    private final SupportTicketSyncService syncService;

    @PostMapping("/sync")
    public Map<String,Object> sync() {

        int updated = syncService.syncAll();

        return Map.of(
                "updated", updated
        );
    }
}