package org.thomcgn.backend.auth.service;

import org.springframework.stereotype.Service;
import org.thomcgn.backend.auth.dto.SelectContextRequest;
import org.thomcgn.backend.auth.dto.SelectContextResponse;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.users.repo.UserOrgRoleRepository;

import java.util.List;

@Service
public class ContextService {

    private final UserOrgRoleRepository userOrgRoleRepository;
    private final JwtService jwtService;

    public ContextService(UserOrgRoleRepository userOrgRoleRepository, JwtService jwtService) {
        this.userOrgRoleRepository = userOrgRoleRepository;
        this.jwtService = jwtService;
    }

    public SelectContextResponse selectContext(Long userId, SelectContextRequest req) {
        if (!userOrgRoleRepository.existsByUserIdAndOrgUnitIdAndEnabledTrue(userId, req.orgUnitId())) {
            throw new RuntimeException("No access to selected context");
        }

        // Alle Rollen für diese OrgUnit (Minimal: nur direkte Rollen)
        List<String> roles = userOrgRoleRepository.findAllActiveByUserId(userId).stream()
                .filter(uor -> uor.getOrgUnit().getId().equals(req.orgUnitId()))
                .map(uor -> uor.getRole().name())
                .toList();

        Long traegerId = userOrgRoleRepository.findAllActiveByUserId(userId).stream()
                .filter(uor -> uor.getOrgUnit().getId().equals(req.orgUnitId()))
                .findFirst()
                .map(uor -> uor.getOrgUnit().getTraeger().getId())
                .orElseThrow();
        String email = SecurityUtils.currentEmail();
        String accessToken = jwtService.issueContextToken(userId, traegerId, req.orgUnitId(), roles, email);
        return new SelectContextResponse(accessToken);
    }
}