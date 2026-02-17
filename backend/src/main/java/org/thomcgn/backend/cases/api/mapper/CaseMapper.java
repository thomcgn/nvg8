package org.thomcgn.backend.cases.api.mapper;

import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.cases.dto.response.*;
import org.thomcgn.backend.cases.model.Bezugsperson;
import org.thomcgn.backend.cases.model.Kind;
import org.thomcgn.backend.cases.model.KindBezugspersonRelation;
import org.thomcgn.backend.cases.model.KinderschutzFall;
import org.thomcgn.backend.model.KommunikationsProfil;
import org.thomcgn.backend.model.Person;

import java.util.Collections;
import java.util.List;

public final class CaseMapper {

    private CaseMapper() {}

    public static KommunikationsProfilResponse toKommunikationsProfil(KommunikationsProfil kp) {
        if (kp == null) return null;
        return new KommunikationsProfilResponse(
                kp.getMutterspracheCode(),
                kp.getBevorzugteSpracheCode(),
                kp.getDolmetschBedarf() != null ? kp.getDolmetschBedarf().name() : null,
                kp.getDolmetschSpracheCode(),
                kp.getHoerStatus() != null ? kp.getHoerStatus().name() : null,
                kp.getCodaStatus() != null ? kp.getCodaStatus().name() : null,
                kp.getGebaerdenspracheCode(),
                kp.getKommunikationsHinweise()
        );
    }

    public static PersonResponseBase toPersonBase(Person p) {
        if (p == null) return null;
        return new PersonResponseBase(
                p.getVorname(),
                p.getNachname(),
                p.getStaatsangehoerigkeitIso2(),
                p.getStaatsangehoerigkeitSonderfall() != null ? p.getStaatsangehoerigkeitSonderfall().name() : null,
                p.getStaatsangehoerigkeitGruppe() != null ? p.getStaatsangehoerigkeitGruppe().name() : null,
                p.getAufenthaltstitelTyp() != null ? p.getAufenthaltstitelTyp().name() : null,
                p.getAufenthaltstitelDetails(),
                toKommunikationsProfil(p.getKommunikationsProfil()),
                p.getStrasse(),
                p.getHausnummer(),
                p.getPlz(),
                p.getOrt(),
                p.getTelefon(),
                p.getKontaktEmail()
        );
    }

    public static BezugspersonSummaryResponse toBezugspersonSummary(Bezugsperson p) {
        if (p == null) return null;
        return new BezugspersonSummaryResponse(
                p.getId(),
                p.getVorname(),
                p.getNachname(),
                p.getOrganisation(),
                p.getTelefon(),
                p.getKontaktEmail(),
                p.getStrasse(),
                p.getHausnummer(),
                p.getPlz(),
                p.getOrt()
        );
    }

    public static BezugspersonResponse toBezugsperson(Bezugsperson p) {
        if (p == null) return null;
        return new BezugspersonResponse(
                p.getId(),
                p.getOrganisation(),
                toPersonBase(p)
        );
    }

    public static KindSummaryResponse toKindSummary(Kind k) {
        if (k == null) return null;
        return new KindSummaryResponse(
                k.getId(),
                k.getVorname(),
                k.getNachname(),
                k.getGeburtsdatum() != null ? k.getGeburtsdatum().toString() : null
        );
    }

    public static KindBezugspersonRelationResponse toRelation(KindBezugspersonRelation rel) {
        if (rel == null) return null;
        return new KindBezugspersonRelationResponse(
                rel.getId(),
                toBezugspersonSummary(rel.getBezugsperson()),
                rel.getRolleImAlltag() != null ? rel.getRolleImAlltag().name() : null,
                rel.getBeziehungstyp() != null ? rel.getBeziehungstyp().name() : null,
                rel.getSorgeStatus() != null ? rel.getSorgeStatus().name() : null,
                rel.getLebtImHaushalt()
        );
    }

    public static KindResponse toKind(Kind k) {
        if (k == null) return null;

        List<KindBezugspersonRelationResponse> rels =
                k.getBezugspersonen() == null ? Collections.emptyList()
                        : k.getBezugspersonen().stream().map(CaseMapper::toRelation).toList();

        return new KindResponse(
                k.getId(),
                k.getGeburtsdatum() != null ? k.getGeburtsdatum().toString() : null,
                toPersonBase(k),
                rels
        );
    }

    public static UserSummaryResponse toUserSummary(User u) {
        if (u == null) return null;
        return new UserSummaryResponse(
                u.getId(),
                u.getEmail(),
                u.getVorname(),
                u.getNachname(),
                u.getRole() != null ? u.getRole().name() : null
        );
    }

    public static KinderschutzFallResponse toFall(KinderschutzFall f) {
        if (f == null) return null;

        List<String> bereiche = f.getGefaehrdungsbereiche() == null
                ? Collections.emptyList()
                : f.getGefaehrdungsbereiche().stream().map(Enum::name).toList();

        return new KinderschutzFallResponse(
                f.getId(),
                f.getVersion(),
                f.getAktenzeichen(),
                toKindSummary(f.getKind()),
                toUserSummary(f.getZustaendigeFachkraft()),
                toUserSummary(f.getTeamleitung()),
                f.getStatus() != null ? f.getStatus().name() : null,
                bereiche,
                f.getLetzteEinschaetzung() != null ? f.getLetzteEinschaetzung().name() : null,
                f.getIefkPflichtig(),
                f.getGerichtEingeschaltet(),
                f.getInobhutnahmeErfolgt(),
                f.getKurzbeschreibung(),
                f.getCreatedAt(),
                f.getUpdatedAt()
        );
    }
}