package org.thomcgn.backend.teams.model;

import jakarta.persistence.*;
import lombok.Data;
import org.thomcgn.backend.facility.model.Facility;

import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "teams", uniqueConstraints = {
        @UniqueConstraint(name = "uk_team_facility_name", columnNames = {"facility_id", "name"})
})
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    // bidirektional optional (nicht zwingend)
    @ManyToMany(mappedBy = "teams")
    private Set<org.thomcgn.backend.auth.data.User> users = new HashSet<>();
}
