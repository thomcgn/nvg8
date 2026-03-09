package org.thomcgn.backend.users.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class MitarbeiterFaehigkeiten {

    @Column(name = "kann_kinder_dolmetschen", nullable = false)
    private Boolean kannKinderDolmetschen = false;

    @Column(name = "kann_bezugspersonen_dolmetschen", nullable = false)
    private Boolean kannBezugspersonenDolmetschen = false;

    @Column(name = "mitarbeiter_sprach_hinweise", length = 500)
    private String hinweise;
}