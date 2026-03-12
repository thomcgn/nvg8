package org.thomcgn.backend.messenger.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.messenger.dto.GroupOptionDto;
import org.thomcgn.backend.messenger.dto.InboxItemDto;
import org.thomcgn.backend.messenger.dto.MarkReadRequest;
import org.thomcgn.backend.messenger.dto.MessageDetailDto;
import org.thomcgn.backend.messenger.dto.SendMessageRequest;
import org.thomcgn.backend.messenger.dto.SentItemDto;
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
        return messageService.getRecipientOptions();
    }

    @GetMapping("/group-options")
    public List<GroupOptionDto> groupOptions() {
        Long traegerId = SecurityUtils.currentTraegerIdOptional();
        if (traegerId == null) return List.of();
        return messageService.getGroupOptions(traegerId);
    }

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody SendMessageRequest request) {
        messageService.sendMessage(
                SecurityUtils.currentUserId(),
                request.subject(),
                request.body(),
                request.recipientUserIds(),
                request.recipientOrgUnitIds(),
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

    @GetMapping("/sent")
    public List<SentItemDto> sent(@RequestParam(defaultValue = "50") int limit) {
        return messageService.getSent(SecurityUtils.currentUserId(), limit);
    }

    @GetMapping("/detail/{messageId}")
    public MessageDetailDto detail(@PathVariable Long messageId) {
        return messageService.getDetail(messageId, SecurityUtils.currentUserId());
    }

    @DeleteMapping("/recipient/{recipientRowId}")
    public ResponseEntity<?> deleteFromInbox(@PathVariable Long recipientRowId) {
        messageService.deleteFromInbox(recipientRowId, SecurityUtils.currentUserId());
        return ResponseEntity.ok().build();
    }
}