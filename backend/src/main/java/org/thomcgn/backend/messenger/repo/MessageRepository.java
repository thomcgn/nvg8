package org.thomcgn.backend.messenger.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.thomcgn.backend.messenger.model.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
}
