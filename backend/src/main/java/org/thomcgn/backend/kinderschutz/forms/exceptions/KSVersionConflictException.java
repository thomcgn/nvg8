package org.thomcgn.backend.kinderschutz.forms.exceptions;

public class KSVersionConflictException extends RuntimeException {
    private final long currentVersion;
    public KSVersionConflictException(long currentVersion) {
        super("Version conflict");
        this.currentVersion = currentVersion;
    }
    public long getCurrentVersion() { return currentVersion; }
}
