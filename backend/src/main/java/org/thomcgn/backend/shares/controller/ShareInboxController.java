package org.thomcgn.backend.shares.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.shares.dto.ShareRequestListItemResponse;
import org.thomcgn.backend.shares.dto.ShareRequestListResponse;
import org.thomcgn.backend.shares.model.CaseShareRequest;
import org.thomcgn.backend.shares.service.ShareInboxService;

import java.util.List;

@RestController
@RequestMapping("/shares/inbox")
public class ShareInboxController {

    private final ShareInboxService inbox;

    public ShareInboxController(ShareInboxService inbox) {
        this.inbox = inbox;
    }

    @GetMapping
    public ResponseEntity<ShareRequestListResponse> inbox(@RequestParam(required = false) String status,
                                                          @RequestParam(defaultValue = "false") boolean mine,
                                                          Pageable pageable) {
        Page<CaseShareRequest> page = inbox.inbox(status, mine, pageable);
        return ResponseEntity.ok(toListResponse(page, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseShareRequest> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(inbox.getDetail(id));
    }

    @GetMapping("/mine")
    public ResponseEntity<ShareRequestListResponse> myRequests(Pageable pageable) {
        Page<CaseShareRequest> page = inbox.myRequests(pageable);
        return ResponseEntity.ok(toListResponse(page, pageable));
    }

    private ShareRequestListResponse toListResponse(Page<CaseShareRequest> page, Pageable pageable) {
        List<ShareRequestListItemResponse> items = page.getContent().stream()
                .map(r -> new ShareRequestListItemResponse(
                        r.getId(),
                        r.getStatus().name(),
                        r.getPartner() != null ? r.getPartner().getId() : null,
                        r.getPartner() != null ? r.getPartner().getName() : null,
                        r.getFalleroeffnung() != null ? r.getFalleroeffnung().getId() : null,
                        r.getFalleroeffnung() != null ? r.getFalleroeffnung().getAktenzeichen() : null,
                        r.getCreatedAt()
                ))
                .toList();

        return new ShareRequestListResponse(
                items,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements()
        );
    }
}