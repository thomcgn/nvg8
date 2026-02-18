package org.thomcgn.backend.cases.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.cases.dto.BezugspersonCreateRequest;
import org.thomcgn.backend.cases.dto.CreateKindRequest;
import org.thomcgn.backend.cases.model.Bezugsperson;
import org.thomcgn.backend.cases.model.Kind;
import org.thomcgn.backend.cases.model.KindBezugspersonRelation;
import org.thomcgn.backend.cases.model.enums.Beziehungstyp;
import org.thomcgn.backend.cases.model.enums.RolleImAlltag;
import org.thomcgn.backend.cases.model.enums.SorgeStatus;
import org.thomcgn.backend.cases.repo.BezugspersonRepository;
import org.thomcgn.backend.cases.repo.KindRepository;
import org.thomcgn.backend.model.Person;
import org.thomcgn.backend.model.enums.*;

import java.time.LocalDate;
import java.util.ArrayList;

@Service
public class CaseService {

    private final KindRepository kindRepository;
    private final BezugspersonRepository bezugspersonRepository;

    public CaseService(KindRepository kindRepository, BezugspersonRepository bezugspersonRepository) {
        this.kindRepository = kindRepository;
        this.bezugspersonRepository = bezugspersonRepository;
    }

    @Transactional
    public Bezugsperson createBezugsperson(BezugspersonCreateRequest req) {
        Bezugsperson p = new Bezugsperson();
        p.setVorname(req.getVorname());
        p.setNachname(req.getNachname());
        p.setStrasse(req.getStrasse());
        p.setHausnummer(req.getHausnummer());
        p.setPlz(req.getPlz());
        p.setOrt(req.getOrt());
        p.setTelefon(req.getTelefon());

        // Kontakt-E-Mail (legacy: "email")
        String kontaktEmail = firstNonBlank(req.getKontaktEmail(), req.getEmail());
        p.setKontaktEmail(kontaktEmail);

        applyPersonMeta(p,
                req.getStaatsangehoerigkeitIso2(), req.getStaatsangehoerigkeitSonderfall(), req.getStaatsangehoerigkeitGruppe(),
                req.getAufenthaltstitelTyp(), req.getAufenthaltstitelDetails(),
                req.getMutterspracheCode(), req.getBevorzugteSpracheCode(), req.getDolmetschBedarf(),
                req.getDolmetschSpracheCode(), req.getHoerStatus(), req.getCodaStatus(),
                req.getGebaerdenspracheCode(), req.getKommunikationsHinweise()
        );

        return bezugspersonRepository.save(p);
    }

    @Transactional
    public Kind createKind(CreateKindRequest req) {

        if (req.getVorname() == null || req.getVorname().isBlank()
                || req.getNachname() == null || req.getNachname().isBlank()) {
            throw new IllegalArgumentException("Vorname und Nachname sind Pflicht.");
        }

        if (req.getGeburtsdatum() == null || req.getGeburtsdatum().isBlank()) {
            throw new IllegalArgumentException("Geburtsdatum ist Pflicht.");
        }

        if (req.getBezugspersonen() == null || req.getBezugspersonen().isEmpty()) {
            throw new IllegalArgumentException("Ein Kind benötigt mindestens eine Bezugsperson.");
        }

        Kind k = new Kind();
        k.setVorname(req.getVorname());
        k.setNachname(req.getNachname());
        k.setStrasse(req.getStrasse());
        k.setHausnummer(req.getHausnummer());
        k.setPlz(req.getPlz());
        k.setOrt(req.getOrt());
        k.setTelefon(req.getTelefon());

        // Kontakt-E-Mail (legacy: "email")
        k.setKontaktEmail(firstNonBlank(req.getKontaktEmail(), req.getEmail()));

        // Legacy: hauptsprache/brauchtDolmetsch unterstützen
        String bevorzugteSprache = firstNonBlank(req.getBevorzugteSpracheCode(), req.getHauptsprache());

        String dolmetschBedarf = req.getDolmetschBedarf();
        if ((dolmetschBedarf == null || dolmetschBedarf.isBlank()) && req.getBrauchtDolmetsch() != null) {
            dolmetschBedarf = req.getBrauchtDolmetsch() ? "SPRACHDOLMETSCHEN" : "KEIN";
        }

        applyPersonMeta(k,
                req.getStaatsangehoerigkeitIso2(), req.getStaatsangehoerigkeitSonderfall(), req.getStaatsangehoerigkeitGruppe(),
                req.getAufenthaltstitelTyp(), req.getAufenthaltstitelDetails(),
                req.getMutterspracheCode(), bevorzugteSprache, dolmetschBedarf,
                req.getDolmetschSpracheCode(), req.getHoerStatus(), req.getCodaStatus(),
                req.getGebaerdenspracheCode(), req.getKommunikationsHinweise()
        );

        k.setGeburtsdatum(LocalDate.parse(req.getGeburtsdatum()));

        if (k.getBezugspersonen() == null) {
            k.setBezugspersonen(new ArrayList<>());
        }

        for (CreateKindRequest.BezugspersonLink link : req.getBezugspersonen()) {
            if (link.getId() == null) {
                throw new IllegalArgumentException("bezugspersonen[].id ist Pflicht.");
            }

            Bezugsperson bp = bezugspersonRepository.findById(link.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Bezugsperson nicht gefunden: " + link.getId()));

            KindBezugspersonRelation rel = new KindBezugspersonRelation();
            rel.setKind(k);
            rel.setBezugsperson(bp);

            if (link.getRolleImAlltag() != null && !link.getRolleImAlltag().isBlank()) {
                rel.setRolleImAlltag(RolleImAlltag.valueOf(link.getRolleImAlltag()));
            } else {
                rel.setRolleImAlltag(RolleImAlltag.SONSTIGE);
            }

            rel.setBeziehungstyp(Beziehungstyp.SONSTIGE);
            rel.setSorgeStatus(SorgeStatus.UNBEKANNT);

            k.getBezugspersonen().add(rel);
        }

        return kindRepository.save(k);
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        if (b != null && !b.isBlank()) return b;
        return null;
    }

    private static void applyPersonMeta(Person target,
                                        String staatsIso2,
                                        String sonderfall,
                                        String gruppe,
                                        String titelTyp,
                                        String titelDetails,
                                        String mutter,
                                        String bevorzugt,
                                        String dolmetsch,
                                        String dolmetschSprache,
                                        String hoer,
                                        String coda,
                                        String gebaerden,
                                        String hinweise) {

        // Staatsangehörigkeit
        if (staatsIso2 != null && !staatsIso2.isBlank()) {
            target.setStaatsangehoerigkeitIso2(staatsIso2.trim().toUpperCase());
        }
        if (sonderfall != null && !sonderfall.isBlank()) {
            target.setStaatsangehoerigkeitSonderfall(StaatsangehoerigkeitSonderfall.valueOf(sonderfall));
        }
        if (gruppe != null && !gruppe.isBlank()) {
            target.setStaatsangehoerigkeitGruppe(StaatsangehoerigkeitGruppe.valueOf(gruppe));
        }

        // Aufenthalt
        if (titelTyp != null && !titelTyp.isBlank()) {
            target.setAufenthaltstitelTyp(AufenthaltstitelTyp.valueOf(titelTyp));
        }
        if (titelDetails != null && !titelDetails.isBlank()) {
            target.setAufenthaltstitelDetails(titelDetails);
        }

        // Kommunikationsprofil
        if (mutter != null && !mutter.isBlank()) {
            target.getKommunikationsProfil().setMutterspracheCode(mutter.trim());
        }
        if (bevorzugt != null && !bevorzugt.isBlank()) {
            target.getKommunikationsProfil().setBevorzugteSpracheCode(bevorzugt.trim());
        }
        if (dolmetsch != null && !dolmetsch.isBlank()) {
            target.getKommunikationsProfil().setDolmetschBedarf(DolmetschBedarf.valueOf(dolmetsch));
        }
        if (dolmetschSprache != null && !dolmetschSprache.isBlank()) {
            target.getKommunikationsProfil().setDolmetschSpracheCode(dolmetschSprache.trim());
        }
        if (hoer != null && !hoer.isBlank()) {
            target.getKommunikationsProfil().setHoerStatus(HoerStatus.valueOf(hoer));
        }
        if (coda != null && !coda.isBlank()) {
            target.getKommunikationsProfil().setCodaStatus(CodaStatus.valueOf(coda));
        }
        if (gebaerden != null && !gebaerden.isBlank()) {
            target.getKommunikationsProfil().setGebaerdenspracheCode(gebaerden.trim());
        }
        if (hinweise != null && !hinweise.isBlank()) {
            target.getKommunikationsProfil().setKommunikationsHinweise(hinweise);
        }
    }
}