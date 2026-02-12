package org.thomcgn.backend.kinderschutz.forms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.thomcgn.backend.cases.model.KinderschutzFall;
import org.thomcgn.backend.model.AuditableEntity;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "ks_form_instances",
        indexes = {
                @Index(name = "idx_ks_form_instances_fall", columnList = "fall_id"),
                @Index(name = "idx_ks_form_instances_instr", columnList = "instrument_code,instrument_version")
        })
@Data
public class KSFormInstance extends AuditableEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "fall_id")
    private KinderschutzFall fall;

    @Column(name = "instrument_code", nullable = false)
    private String instrumentCode;

    @Column(name = "instrument_version", nullable = false)
    private String instrumentVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FormStatus status = FormStatus.DRAFT;

    @OneToMany(mappedBy = "instance", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KSFormAnswer> answers = new ArrayList<>();
}
