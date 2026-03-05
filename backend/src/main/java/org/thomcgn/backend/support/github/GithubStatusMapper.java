package org.thomcgn.backend.support.github;

import org.thomcgn.backend.support.tickets.model.SupportTicketStatus;

import java.util.List;
import java.util.Map;

public class GithubStatusMapper {

    public static SupportTicketStatus statusFromLabels(List<Map> labels) {

        for (Map l : labels) {

            String name = (String) l.get("name");

            if ("status:erledigt".equalsIgnoreCase(name)) {
                return SupportTicketStatus.CLOSED;
            }

            if ("status:offen".equalsIgnoreCase(name)) {
                return SupportTicketStatus.OPEN;
            }
        }

        return SupportTicketStatus.OPEN;
    }
}