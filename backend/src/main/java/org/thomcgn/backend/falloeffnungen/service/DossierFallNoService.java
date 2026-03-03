package org.thomcgn.backend.falloeffnungen.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.falloeffnungen.model.DossierFallNoSeq;
import org.thomcgn.backend.falloeffnungen.repo.DossierFallNoSeqRepository;

@Service
public class DossierFallNoService {

    private final DossierFallNoSeqRepository seqRepo;

    public DossierFallNoService(DossierFallNoSeqRepository seqRepo) {
        this.seqRepo = seqRepo;
    }

    /**
     * ✅ Race-safe: row lock auf dossier_fallno_seq
     */
    @Transactional
    public int nextFallNo(Long dossierId) {
        DossierFallNoSeq seq = seqRepo.findByDossierId(dossierId)
                .orElseGet(() -> seqRepo.save(new DossierFallNoSeq(dossierId, 1)));

        int current = seq.getNextValue();
        seq.setNextValue(current + 1);
        seqRepo.save(seq);

        return current;
    }
}