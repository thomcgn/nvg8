package org.thomcgn.backend.orgunits.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.service.AdminGuard;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.dto.CreateOrgUnitRequest;
import org.thomcgn.backend.orgunits.dto.OrgUnitNodeDto;
import org.thomcgn.backend.orgunits.dto.UpdateOrgUnitRequest;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;

import java.util.*;

@Service
public class OrgUnitService {

    private final OrgUnitRepository orgUnitRepository;
    private final AdminGuard adminGuard;

    public OrgUnitService(OrgUnitRepository orgUnitRepository, AdminGuard adminGuard) {
        this.orgUnitRepository = orgUnitRepository;
        this.adminGuard = adminGuard;
    }

    @Transactional(readOnly = true)
    public OrgUnitNodeDto getTreeForCurrentTraeger() {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        List<OrgUnit> all = orgUnitRepository.findAllEnabledByTraegerId(traegerId);
        if (all.isEmpty()) throw DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "No org units found.");

        Map<Long, OrgUnitNodeDtoBuilder> map = new HashMap<>();
        for (OrgUnit ou : all) {
            map.put(ou.getId(), new OrgUnitNodeDtoBuilder(ou));
        }

        OrgUnitNodeDtoBuilder root = null;
        for (OrgUnit ou : all) {
            OrgUnitNodeDtoBuilder node = map.get(ou.getId());
            if (ou.getParent() == null) {
                root = node;
            } else {
                OrgUnitNodeDtoBuilder parent = map.get(ou.getParent().getId());
                if (parent != null) parent.children.add(node);
            }
        }

        if (root == null) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "Traeger root org unit missing.");
        }

        return root.build();
    }

    @Transactional
    public OrgUnitNodeDto create(CreateOrgUnitRequest req) {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        OrgUnitType type;
        try { type = OrgUnitType.valueOf(req.type()); }
        catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown org unit type: " + req.type());
        }

        // Berechtigung prüfen über Parent-ID (Bug-Fix: früher wurde #orgUnitId geprüft, das nicht existierte)
        OrgUnit parent = adminGuard.requireCanManageOrgUnit(req.parentId());

        if (!parent.getTraeger().getId().equals(traegerId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Parent is not in current traeger.");
        }

        OrgUnit ou = new OrgUnit();
        ou.setTraeger(parent.getTraeger());
        ou.setParent(parent);
        ou.setType(type);
        ou.setName(req.name().trim());
        ou.setEnabled(true);
        applyAddress(ou, req.strasse(), req.hausnummer(), req.plz(), req.ort(), req.leitung(), req.ansprechpartner());

        OrgUnit saved = orgUnitRepository.save(ou);
        return toDto(saved, List.of());
    }

    @Transactional
    public OrgUnitNodeDto update(Long id, UpdateOrgUnitRequest req) {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        OrgUnit ou = adminGuard.requireCanManageOrgUnit(id);
        if (!ou.getTraeger().getId().equals(traegerId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "OrgUnit not in current traeger.");
        }

        ou.setName(req.name().trim());
        applyAddress(ou, req.strasse(), req.hausnummer(), req.plz(), req.ort(), req.leitung(), req.ansprechpartner());

        return toDto(orgUnitRepository.save(ou), List.of());
    }

    @Transactional
    public void disable(Long id) {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        OrgUnit ou = adminGuard.requireCanManageOrgUnit(id);
        if (!ou.getTraeger().getId().equals(traegerId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "OrgUnit not in current traeger.");
        }
        if (ou.getType() == OrgUnitType.TRAEGER) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Träger-Root-Einheit kann nicht deaktiviert werden.");
        }

        ou.setEnabled(false);
        orgUnitRepository.save(ou);
    }

    // -------------------------------------------------------------------------

    private static void applyAddress(OrgUnit ou, String strasse, String hausnummer,
                                     String plz, String ort, String leitung, String ansprechpartner) {
        ou.setStrasse(trim(strasse));
        ou.setHausnummer(trim(hausnummer));
        ou.setPlz(trim(plz));
        ou.setOrt(trim(ort));
        ou.setLeitung(trim(leitung));
        ou.setAnsprechpartner(trim(ansprechpartner));
    }

    private static String trim(String s) {
        if (s == null || s.isBlank()) return null;
        return s.trim();
    }

    private static OrgUnitNodeDto toDto(OrgUnit ou, List<OrgUnitNodeDto> children) {
        return new OrgUnitNodeDto(
                ou.getId(), ou.getType().name(), ou.getName(), ou.isEnabled(), children,
                ou.getStrasse(), ou.getHausnummer(), ou.getPlz(), ou.getOrt(),
                ou.getLeitung(), ou.getAnsprechpartner()
        );
    }

    private static class OrgUnitNodeDtoBuilder {
        final OrgUnit ou;
        final List<OrgUnitNodeDtoBuilder> children = new ArrayList<>();

        OrgUnitNodeDtoBuilder(OrgUnit ou) { this.ou = ou; }

        OrgUnitNodeDto build() {
            children.sort(Comparator.comparing(a -> a.ou.getType().name() + "|" + a.ou.getName()));
            List<OrgUnitNodeDto> built = children.stream().map(OrgUnitNodeDtoBuilder::build).toList();
            return toDto(ou, built);
        }
    }
}
