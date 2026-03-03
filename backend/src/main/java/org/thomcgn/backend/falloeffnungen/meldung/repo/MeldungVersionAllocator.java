package org.thomcgn.backend.falloeffnungen.meldung.repo;

public interface MeldungVersionAllocator {
    int nextVersionNo(long fallId);
}