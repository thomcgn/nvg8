package org.thomcgn.backend.messenger.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.common.security.SecurityUtils;
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
    public Map<String, Long> unread() {
        long count = messageService.getUnreadCount(SecurityUtils.currentUserId());
        return Map.of("count", count);
    }

    @GetMapping("/inbox")
    public List<InboxItemDto> inbox(@RequestParam(defaultValue = "50") int limit) {
        return messageService.getInbox(SecurityUtils.currentUserId(), limit);
    }

    @GetMapping("/recipient-options")
    public List<UserOptionDto> recipientOptions() {
        // falls du den User brauchst, kannst du hier SecurityUtils.currentUserIdRequired() nutzen
        return messageService.getRecipientOptions();
    }

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody SendMessageRequest request) {
        messageService.sendMessage(
                SecurityUtils.currentUserId(),
                request.subject(),
                request.body(),
                request.recipientUserIds(),
                request.threadId()
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mark-read")
    public ResponseEntity<?> markRead(@RequestBody MarkReadRequest request) {
        messageService.markRead(
                request.recipientRowId(),
                SecurityUtils.currentUserId(),
                request.isRead()
        );
        return ResponseEntity.ok().build();
    }
}