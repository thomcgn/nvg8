package org.thomcgn.backend.s8a.model;

import jakarta.persistence.*;
import org.thomcgn.backend.common.persistence.AuditableEntity;

/**
 * Personen-/Institutionen-Stammdatensatz innerhalb eines §8a-Vorgangs.
 *
 * Warum pro S8aCase?
 * - Du brauchst Geschwister, Bezugspersonen, Rechte & Sperren im Kontext dieses Vorgangs.
 * - Datenschutz: Keine globale "Personenverwaltung" nötig, aber trotzdem strukturierte Daten.
 * - Später kann man optional eine echte Fall-Person-Entity referenzieren.
 */
@Entity
@Table(
        name = "s8a_case_persons",
        indexes = {
                @Index(name = "ix_s8a_case_person_case", columnList = "s8a_case_id"),
                @Index(name = "ix_s8a_case_person_type", columnList = "person_type")
        }
)
public class S8aCasePerson extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "s8a_case_id", nullable = false)
    private S8aCase s8aCase;

    @Enumerated(EnumType.STRING)
    @Column(name = "person_type", nullable = false, length = 20)
    private S8aPersonType personType;

    // Bei Institution: name = "Jugendamt XY", bei Personen: Anzeige-/Vollname
    @Column(name = "display_name", nullable = false, length = 250)
    private String displayName;

    // Optional strukturierter Name (wenn vorhanden)
    @Column(name = "first_name", length = 120)
    private String firstName;

    @Column(name = "last_name", length = 120)
    private String lastName;

    @Column(name = "date_of_birth", length = 20)
    private String dateOfBirth; // bewusst String (ISO-YYYY-MM-DD) -> weniger Probleme bei unklaren Datenlagen

    @Column(name = "notes", length = 4000)
    private String notes;

    // Optional: Referenz in einem späteren Personenmodul
    @Column(name = "external_person_ref")
    private Long externalPersonRef;

    // Getter/Setter ...
    public Long getId() { return id; }

    public S8aCase getS8aCase() { return s8aCase; }
    public void setS8aCase(S8aCase s8aCase) { this.s8aCase = s8aCase; }

    public S8aPersonType getPersonType() { return personType; }
    public void setPersonType(S8aPersonType personType) { this.personType = personType; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Long getExternalPersonRef() { return externalPersonRef; }
    public void setExternalPersonRef(Long externalPersonRef) { this.externalPersonRef = externalPersonRef; }
}