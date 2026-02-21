package org.thomcgn.backend.orgunits.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.service.AdminGuard;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.dto.CreateOrgUnitRequest;
import org.thomcgn.backend.orgunits.dto.OrgUnitNodeDto;
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

        // build map
        Map<Long, OrgUnitNodeDtoBuilder> map = new HashMap<>();
        for (OrgUnit ou : all) {
            map.put(ou.getId(), new OrgUnitNodeDtoBuilder(ou));
        }

        OrgUnitNodeDtoBuilder root = null;

        for (OrgUnit ou : all) {
            OrgUnitNodeDtoBuilder node = map.get(ou.getId());
            if (ou.getParent() == null) {
                // should be TRAEGER root
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
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown org unit type: " + req.type()); }

        // parent must exist and be manageable
        OrgUnit parent = adminGuard.requireCanManageOrgUnit(req.parentId());

        if (!parent.getTraeger().getId().equals(traegerId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Parent is not in current traeger.");
        }

        // simple rule: child must be same traeger
        OrgUnit ou = new OrgUnit();
        ou.setTraeger(parent.getTraeger());
        ou.setParent(parent);
        ou.setType(type);
        ou.setName(req.name().trim());
        ou.setEnabled(true);

        OrgUnit saved = orgUnitRepository.save(ou);

        return new OrgUnitNodeDto(saved.getId(), saved.getType().name(), saved.getName(), saved.isEnabled(), List.of());
    }

    private static class OrgUnitNodeDtoBuilder {
        final Long id;
        final String type;
        final String name;
        final boolean enabled;
        final List<OrgUnitNodeDtoBuilder> children = new ArrayList<>();

        OrgUnitNodeDtoBuilder(OrgUnit ou) {
            this.id = ou.getId();
            this.type = ou.getType().name();
            this.name = ou.getName();
            this.enabled = ou.isEnabled();
        }

        OrgUnitNodeDto build() {
            // optional: sort children
            children.sort(Comparator.comparing(a -> a.type + "|" + a.name));
            List<OrgUnitNodeDto> built = children.stream().map(OrgUnitNodeDtoBuilder::build).toList();
            return new OrgUnitNodeDto(id, type, name, enabled, built);
        }
    }
}