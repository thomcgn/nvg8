package org.thomcgn.backend.falloeffnungen.meldung.repo;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MeldungVersionAllocatorImpl implements MeldungVersionAllocator {

    private final JdbcTemplate jdbc;

    public MeldungVersionAllocatorImpl(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public int nextVersionNo(long fallId) {
        Integer v = jdbc.queryForObject("""
            INSERT INTO fall_meldung_version_seq (falloeffnung_id, next_value)
            VALUES (?, 2)
            ON CONFLICT (falloeffnung_id)
            DO UPDATE SET next_value = fall_meldung_version_seq.next_value + 1
            RETURNING next_value - 1
        """, Integer.class, fallId);

        if (v == null) throw new IllegalStateException("Could not allocate version_no for fallId=" + fallId);
        return v;
    }
}