package org.thomcgn.backend.messenger.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.dto.AuthPrincipal;
import org.thomcgn.backend.messenger.dto.InboxItemDto;
import org.thomcgn.backend.messenger.dto.MarkReadRequest;
import org.thomcgn.backend.messenger.dto.SendMessageRequest;
import org.thomcgn.backend.messenger.dto.UserOptionDto;
import org.thomcgn.backend.messenger.service.MessageService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/unread-count")
    public Map<String, Long> unread(@AuthenticationPrincipal AuthPrincipal user) {
        long count = messageService.getUnreadCount(user.id());
        return Map.of("count", count);
    }

    @GetMapping("/inbox")
    public List<InboxItemDto> inbox(
            @AuthenticationPrincipal AuthPrincipal user,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return messageService.getInbox(user.id(), limit);
    }

    @GetMapping("/recipient-options")
    public List<UserOptionDto> recipientOptions() {
        return messageService.getRecipientOptions();
    }

    @PostMapping("/send")
    public ResponseEntity<?> send(
            @AuthenticationPrincipal AuthPrincipal user,
            @RequestBody SendMessageRequest request
    ) {
        messageService.sendMessage(
                user.id(),
                request.subject(),
                request.body(),
                request.recipientUserIds(),
                request.threadId()
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mark-read")
    public ResponseEntity<?> markRead(
            @AuthenticationPrincipal AuthPrincipal user,
            @RequestBody MarkReadRequest request
    ) {
        messageService.markRead(
                request.recipientRowId(),
                user.id(),
                request.isRead()
        );
        return ResponseEntity.ok().build();
    }
}