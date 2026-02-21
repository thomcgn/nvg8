package org.thomcgn.backend.users.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AdminGuard;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.users.dto.AssignRoleRequest;
import org.thomcgn.backend.users.dto.CreateUserRequest;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.model.UserOrgRole;
import org.thomcgn.backend.users.repo.UserOrgRoleRepository;
import org.thomcgn.backend.users.repo.UserRepository;

@Service
    public class UserAdminService {

    private final UserRepository userRepository;
    private final UserOrgRoleRepository userOrgRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminGuard adminGuard;

    public UserAdminService(
            UserRepository userRepository,
            UserOrgRoleRepository userOrgRoleRepository,
            PasswordEncoder passwordEncoder,
            AdminGuard adminGuard
    ) {
        this.userRepository = userRepository;
        this.userOrgRoleRepository = userOrgRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminGuard = adminGuard;
    }

    @Transactional
    public User createUser(CreateUserRequest req) {
        userRepository.findByEmailIgnoreCase(req.email()).ifPresent(u -> {
            throw DomainException.conflict(ErrorCode.USER_EMAIL_ALREADY_EXISTS, "Email already exists.");
        });

        User u = new User();
        u.setEmail(req.email().trim().toLowerCase());
        u.setPasswordHash(passwordEncoder.encode(req.initialPassword()));
        u.setEnabled(true);

        u.setVorname(req.vorname());
        u.setNachname(req.nachname());

        return userRepository.save(u);
    }

    @Transactional
    public UserOrgRole assignRole(Long userId, AssignRoleRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        OrgUnit targetOrg = adminGuard.requireCanManageOrgUnit(req.orgUnitId());

        Role role;
        try {
            role = Role.valueOf(req.role());
        } catch (IllegalArgumentException ex) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown role: " + req.role());
        }

        // upsert (enabled=true)
        return userOrgRoleRepository.findByUserIdAndOrgUnitIdAndRole(userId, targetOrg.getId(), role)
                .map(existing -> {
                    existing.setEnabled(true);
                    return existing;
                })
                .orElseGet(() -> {
                    UserOrgRole uor = new UserOrgRole();
                    uor.setUser(user);
                    uor.setOrgUnit(targetOrg);
                    uor.setRole(role);
                    uor.setEnabled(true);
                    return userOrgRoleRepository.save(uor);
                });
    }

    @Transactional
    public void disableRole(Long userId, Long userOrgRoleId) {
        UserOrgRole uor = userOrgRoleRepository.findById(userOrgRoleId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Role assignment not found"));

        if (!uor.getUser().getId().equals(userId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Role assignment does not belong to user.");
        }

        // check admin permission on that org unit
        adminGuard.requireCanManageOrgUnit(uor.getOrgUnit().getId());

        uor.setEnabled(false);
    }
}