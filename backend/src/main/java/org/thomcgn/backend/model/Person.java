package org.thomcgn.backend.model;

import jakarta.persistence.MappedSuperclass;
import lombok.Data;

@Data
@MappedSuperclass
public abstract class Person {
    private String vorname;
    private String nachname;

    private String strasse;
    private String hausnummer;
    private String plz;
    private String ort;

    private String telefon;
    private String email;
}
