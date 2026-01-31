package org.thomcgn.backend.auth.data;

import jakarta.persistence.*;
import lombok.Data;


import java.util.UUID;
@Data
@Entity
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @Column(unique = true, nullable = false)
    private String email;
    @Column(nullable = false)
    private String passwordHash;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    private boolean enabled = true;

}
