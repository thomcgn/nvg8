package org.thomcgn.backend.kinderschutz.forms.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.kinderschutz.catalog.KSItem;

@Entity
@Table(
        name = "ks_form_answers",
        uniqueConstraints = @UniqueConstraint(name="uq_instance_item", columnNames = {"instance_id","item_id"})
)
@Data
public class KSFormAnswer {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "instance_id")
    private KSFormInstance instance;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private KSItem item;

    // Wir speichern erstmal ALLES als String (inkl. TRI_STATE)
    @Lob
    @Column(name = "value_string")
    private String value;
}
