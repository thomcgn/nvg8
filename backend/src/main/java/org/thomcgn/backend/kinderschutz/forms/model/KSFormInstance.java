package org.thomcgn.backend.kinderschutz.forms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thomcgn.backend.cases.model.KinderschutzFall;
import org.thomcgn.backend.kinderschutz.catalog.KSInstrument;
import org.thomcgn.backend.model.AuditableEntity;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "ks_form_instances")
@Data
public class KSFormInstance extends AuditableEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version; // Optimistic Lock / "Instance-Version"

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "fall_id")
    private KinderschutzFall fall;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "instrument_id")
    private KSInstrument instrument;

    @Enumerated(EnumType.STRING)
    private KSFormStatus status = KSFormStatus.DRAFT;

    @OneToMany(mappedBy = "instance", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KSFormAnswer> answers = new ArrayList<>();
}
