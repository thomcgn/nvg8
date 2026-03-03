package org.thomcgn.backend.falloeffnungen.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "dossier_fallno_seq")
public class DossierFallNoSeq {

    @Id
    @Column(name = "dossier_id")
    private Long dossierId;

    @Column(name = "next_value", nullable = false)
    private Integer nextValue;

    protected DossierFallNoSeq() {}

    public DossierFallNoSeq(Long dossierId, Integer nextValue) {
        this.dossierId = dossierId;
        this.nextValue = nextValue;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public Integer getNextValue() {
        return nextValue;
    }

    public void setNextValue(Integer nextValue) {
        this.nextValue = nextValue;
    }
}