package org.thomcgn.backend.audit.model;

public enum AuditEventAction {
    FALL_CREATED,
    FALL_NOTE_ADDED,
    FALL_STATUS_CHANGED,

    INVITE_CREATED,
    INVITE_ACCEPTED,
    INVITE_REVOKED
}