package org.thomcgn.backend.auth;

import org.thomcgn.backend.auth.model.Role;

import java.util.Map;

public final class RbacPolicy {
    private RbacPolicy() {}

    // niedrig -> hoch
    private static final Map<Role, Integer> RANK = Map.of(
            Role.DATENSCHUTZBEAUFTRAGTER, 0,
            Role.READ_ONLY, 1,
            Role.FACHKRAFT, 2,
            Role.IEFK, 3,
            Role.TEAMLEITUNG, 4,
            Role.ADMIN, 5
    );

    public static int rank(Role r) {
        return RANK.getOrDefault(r, -1);
    }

    public static Decision canChangeRole(Role actor, Role target, Role next, boolean isSelf, long adminsLeftAfter) {
        if (isSelf) return Decision.deny("Eigene Rolle kann nicht geändert werden.");

        // niemand darf höhergestellte ändern
        if (rank(target) > rank(actor)) {
            return Decision.deny("Du darfst keine höhergestellte Rolle ändern.");
        }

        // niemand darf über sein Level promoten
        if (rank(next) > rank(actor)) {
            return Decision.deny("Du darfst niemanden über dein eigenes Level promoten.");
        }

        // ADMIN darf nur von ADMIN geändert werden (implizit auch durch Rank, aber als klare Regel)
        if (target == Role.ADMIN && actor != Role.ADMIN) {
            return Decision.deny("ADMIN kann nur von ADMIN geändert werden.");
        }

        // mindestens 1 ADMIN muss übrig bleiben
        if (target == Role.ADMIN && next != Role.ADMIN && adminsLeftAfter < 1) {
            return Decision.deny("Es muss mindestens ein ADMIN im System bleiben.");
        }

        return Decision.allow();
    }

    public record Decision(boolean allowed, String reason) {
        public static Decision allow() { return new Decision(true, null); }
        public static Decision deny(String reason) { return new Decision(false, reason); }
    }
}
