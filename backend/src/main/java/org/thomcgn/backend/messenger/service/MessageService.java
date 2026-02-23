package org.thomcgn.backend.messenger.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.messenger.dto.InboxItemDto;
import org.thomcgn.backend.messenger.dto.MessageDto;
import org.thomcgn.backend.messenger.dto.UserOptionDto;
import org.thomcgn.backend.messenger.model.Message;
import org.thomcgn.backend.messenger.model.MessageRecipient;
import org.thomcgn.backend.messenger.repo.MessageRecipientRepository;
import org.thomcgn.backend.messenger.repo.MessageRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final MessageRecipientRepository recipientRepository;
    private final UserRepository userRepository;

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

                    return new InboxItemDto(
                            recipientRowId,
                            isRead,
                            null,
                            new MessageDto(messageId, subject, bodyPreview, createdAt, senderId, null)
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

    @Transactional
    public void sendMessage(Long senderId,
                            String subject,
                            String body,
                            List<Long> recipients,
                            Long threadId) {

        Message message = messageRepository.save(
                Message.builder()
                        .senderId(senderId)
                        .subject(subject)
                        .body(body)
                        .threadId(threadId)
                        .createdAt(OffsetDateTime.now())
                        .build()
        );

        for (Long userId : recipients) {
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