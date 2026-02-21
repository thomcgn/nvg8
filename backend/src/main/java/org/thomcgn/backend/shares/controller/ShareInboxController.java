package org.thomcgn.backend.shares.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.shares.dto.ShareRequestDetailResponse;
import org.thomcgn.backend.shares.dto.ShareRequestListResponse;
import org.thomcgn.backend.shares.service.ShareInboxService;

@RestController
@RequestMapping("/shares/inbox")
public class ShareInboxController {

    private final ShareInboxService inbox;

    public ShareInboxController(ShareInboxService inbox) {
        this.inbox = inbox;
    }

    // Default: aktuelle Einrichtung (Kontext)
    @GetMapping
    public ResponseEntity<ShareRequestListResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean traegerWide,
            @PageableDefault(size = 30) Pageable pageable
    ) {
        return ResponseEntity.ok(inbox.inbox(status, traegerWide, pageable));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<ShareRequestDetailResponse> detail(@PathVariable Long requestId) {
        return ResponseEntity.ok(inbox.getDetail(requestId));
    }

    @GetMapping("/mine")
    public ResponseEntity<ShareRequestListResponse> my(
            @PageableDefault(size = 30) Pageable pageable
    ) {
        return ResponseEntity.ok(inbox.myRequests(pageable));
    }
}