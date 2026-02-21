package org.thomcgn.backend.aktenzeichen.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.aktenzeichen.model.TraegerAktennummerSequence;
import org.thomcgn.backend.aktenzeichen.repo.TraegerAktennummerSequenceRepository;

import java.time.Clock;
import java.time.LocalDate;

@Service
public class AktennummerService {

    private final TraegerAktennummerSequenceRepository repo;
    private final Clock clock;

    public AktennummerService(TraegerAktennummerSequenceRepository repo) {
        this.repo = repo;
        this.clock = Clock.systemUTC();
    }

    /**
     * Generiert eine neue Aktennummer pro Träger und Jahr, z.B.:
     * CAR-2026-000123 oder 2026-000123 (je nach prefix)
     */
    @Transactional
    public String next(Long traegerId, String prefix) {
        int year = LocalDate.now(clock).getYear();

        TraegerAktennummerSequence seq = repo.findForUpdate(traegerId, year)
                .orElseGet(() -> {
                    TraegerAktennummerSequence s = new TraegerAktennummerSequence();
                    s.setTraegerId(traegerId);
                    s.setYear(year);
                    s.setNextValue(1);
                    return repo.save(s);
                });

        long value = seq.getNextValue();
        seq.setNextValue(value + 1);
        // save not strictly required because entity is managed, but ok:
        repo.save(seq);

        String number = String.format("%d-%06d", year, value);
        if (prefix != null && !prefix.isBlank()) {
            return prefix.trim() + "-" + number;
        }
        return number;
    }
}