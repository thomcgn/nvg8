package org.thomcgn.backend.shares.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

@Entity
@Table(
        name = "external_partners",
        uniqueConstraints = @UniqueConstraint(name="uk_partner_name", columnNames = "name")
)
public class ExternalPartner extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private PartnerType type;

    @Column(length = 254)
    private String contactEmail;

    @Column(length = 500)
    private String notes;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public PartnerType getType() { return type; }
    public void setType(PartnerType type) { this.type = type; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}