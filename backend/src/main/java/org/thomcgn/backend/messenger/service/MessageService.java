package org.thomcgn.backend.messenger.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.thomcgn.backend.messenger.dto.GroupOptionDto;
import org.thomcgn.backend.messenger.dto.InboxItemDto;
import org.thomcgn.backend.messenger.dto.MessageDetailDto;
import org.thomcgn.backend.messenger.dto.MessageDto;
import org.thomcgn.backend.messenger.dto.SentItemDto;
import org.thomcgn.backend.messenger.dto.UserOptionDto;
import org.thomcgn.backend.messenger.model.Message;
import org.thomcgn.backend.messenger.model.MessageRecipient;
import org.thomcgn.backend.messenger.repo.MessageRecipientRepository;
import org.thomcgn.backend.messenger.repo.MessageRepository;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitMembershipRepository;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final MessageRecipientRepository recipientRepository;
    private final UserRepository userRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final OrgUnitMembershipRepository orgUnitMembershipRepository;

    public long getUnreadCount(Long userId) {
        return recipientRepository.countUnread(userId);
    }

    public List<InboxItemDto> getInbox(Long userId, int limit) {
        List<Map<String, Object>> rows = recipientRepository.findInbox(userId, limit);

        return rows.stream()
                .filter(Objects::nonNull)
                .map(r -> {
                    long recipientRowId = ((Number) r.get("recipientRowId")).longValue();
                    boolean isRead = (Boolean) r.get("isRead");

                    long messageId = ((Number) r.get("messageId")).longValue();
                    String subject = (String) r.get("subject");
                    String body = (String) r.get("body");
                    String createdAt = String.valueOf(r.get("createdAt"));
                    long senderId = ((Number) r.get("senderId")).longValue();

                    String bodyPreview = body == null ? "" :
                            (body.length() > 160 ? body.substring(0, 160) : body);

                    String senderName = (String) r.get("senderName");

                    return new InboxItemDto(
                            recipientRowId,
                            isRead,
                            null,
                            new MessageDto(messageId, subject, bodyPreview, createdAt, senderId, senderName)
                    );
                })
                .toList();
    }

    public List<UserOptionDto> getRecipientOptions() {
        return userRepository.findAll().stream()
                .map(u -> new UserOptionDto(
                        u.getId(),
                        u.getDisplayName() != null
                                ? u.getDisplayName()
                                : u.getUsername()
                ))
                .toList();
    }

    public List<GroupOptionDto> getGroupOptions(Long traegerId) {
        var types = List.of(OrgUnitType.TEAM, OrgUnitType.ABTEILUNG, OrgUnitType.GRUPPE);
        return orgUnitRepository.findAllEnabledByTraegerId(traegerId).stream()
                .filter(ou -> types.contains(ou.getType()))
                .map(ou -> new GroupOptionDto(ou.getId(), ou.getName(), ou.getType().name()))
                .toList();
    }

    @Transactional
    public void sendMessage(Long senderId,
                            String subject,
                            String body,
                            List<Long> recipientUserIds,
                            List<Long> recipientOrgUnitIds,
                            Long threadId) {

        Set<Long> resolved = new HashSet<>();
        if (recipientUserIds != null) resolved.addAll(recipientUserIds);

        if (recipientOrgUnitIds != null) {
            for (Long ouId : recipientOrgUnitIds) {
                orgUnitMembershipRepository.findAllEnabledByOrgUnitId(ouId)
                        .forEach(m -> resolved.add(m.getUser().getId()));
            }
        }

        Message message = messageRepository.save(
                Message.builder()
                        .senderId(senderId)
                        .subject(subject)
                        .body(body)
                        .threadId(threadId)
                        .createdAt(OffsetDateTime.now())
                        .build()
        );

        for (Long userId : resolved) {
            recipientRepository.save(
                    MessageRecipient.builder()
                            .messageId(message.getId())
                            .userId(userId)
                            .folder("INBOX")
                            .isRead(false)
                            .createdAt(OffsetDateTime.now())
                            .build()
            );
        }
    }

    public List<SentItemDto> getSent(Long senderId, int limit) {
        List<Map<String, Object>> rows = messageRepository.findSent(senderId, limit);
        return rows.stream()
                .filter(Objects::nonNull)
                .map(r -> {
                    long messageId = ((Number) r.get("messageId")).longValue();
                    String subject = (String) r.get("subject");
                    String body = (String) r.get("body");
                    String createdAt = String.valueOf(r.get("createdAt"));
                    int recipientCount = ((Number) r.get("recipientCount")).intValue();
                    String recipientNames = (String) r.get("recipientNames");
                    String bodyPreview = body == null ? "" : (body.length() > 160 ? body.substring(0, 160) : body);
                    return new SentItemDto(messageId, subject, bodyPreview, createdAt, recipientCount, recipientNames);
                })
                .toList();
    }

    public MessageDetailDto getDetail(Long messageId, Long userId) {
        Map<String, Object> row = messageRepository.findDetailForUser(messageId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        long msgId = ((Number) row.get("messageId")).longValue();
        String subject = (String) row.get("subject");
        String body = (String) row.get("body");
        String createdAt = String.valueOf(row.get("createdAt"));
        long senderId = ((Number) row.get("senderId")).longValue();
        String senderName = (String) row.get("senderName");
        Long recipientRowId = row.get("recipientRowId") != null ? ((Number) row.get("recipientRowId")).longValue() : null;
        Boolean isRead = (Boolean) row.get("isRead");

        List<String> recipientNames = recipientRepository.findRecipientNames(messageId);

        return new MessageDetailDto(msgId, subject, body, createdAt, senderId, senderName, recipientRowId, isRead, recipientNames);
    }

    @Transactional
    public void deleteFromInbox(Long recipientRowId, Long userId) {
        recipientRepository.softDelete(recipientRowId, userId, OffsetDateTime.now());
    }

    @Transactional
    public void markRead(Long recipientRowId, Long userId, boolean isRead) {
        MessageRecipient mr = recipientRepository.findById(recipientRowId)
                .orElseThrow();

        if (!mr.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        mr.setIsRead(isRead);
        mr.setReadAt(isRead ? OffsetDateTime.now() : null);

        recipientRepository.save(mr);
    }
}