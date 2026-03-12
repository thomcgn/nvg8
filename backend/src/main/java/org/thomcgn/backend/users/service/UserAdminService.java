package org.thomcgn.backend.users.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AdminGuard;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitMembership;
import org.thomcgn.backend.orgunits.repo.OrgUnitMembershipRepository;
import org.thomcgn.backend.users.dto.AssignRoleRequest;
import org.thomcgn.backend.users.dto.ChangeRoleRequest;
import org.thomcgn.backend.users.dto.CreateUserRequest;
import org.thomcgn.backend.users.dto.KommunikationsProfilDto;
import org.thomcgn.backend.users.dto.MitarbeiterFaehigkeitenDto;
import org.thomcgn.backend.users.model.AufenthaltstitelTyp;
import org.thomcgn.backend.users.model.CodaStatus;
import org.thomcgn.backend.users.model.DolmetschBedarf;
import org.thomcgn.backend.users.model.HoerStatus;
import org.thomcgn.backend.users.model.KommunikationsProfil;
import org.thomcgn.backend.users.model.MitarbeiterFaehigkeiten;
import org.thomcgn.backend.users.model.StaatsangehoerigkeitGruppe;
import org.thomcgn.backend.users.model.StaatsangehoerigkeitSonderfall;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

@Service
public class UserAdminService {

    private final UserRepository userRepository;
    private final OrgUnitMembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminGuard adminGuard;

    public UserAdminService(
            UserRepository userRepository,
            OrgUnitMembershipRepository membershipRepository,
            PasswordEncoder passwordEncoder,
            AdminGuard adminGuard
    ) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
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

        applyPersonFields(u, req);
        u.setMitarbeiterFaehigkeiten(toMitarbeiterFaehigkeiten(req.mitarbeiterFaehigkeiten()));

        if (req.defaultOrgUnitId() != null) {
            OrgUnit defaultOrgUnit = adminGuard.requireCanManageOrgUnit(req.defaultOrgUnitId());
            u.setDefaultOrgUnit(defaultOrgUnit);
            u.setDefaultTraeger(defaultOrgUnit.getTraeger());
        }

        User saved = userRepository.save(u);

        if (req.roles() != null) {
            for (AssignRoleRequest roleReq : req.roles()) {
                assignRoleInternal(saved, roleReq);
            }
        }

        return saved;
    }

    @Transactional
    public OrgUnitMembership assignRole(Long userId, AssignRoleRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        return assignRoleInternal(user, req);
    }

    @Transactional
    public void disableRole(Long userId, Long membershipId) {
        OrgUnitMembership m = membershipRepository.findById(membershipId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Role assignment not found"));

        if (!m.getUser().getId().equals(userId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Role assignment does not belong to user.");
        }

        adminGuard.requireCanManageOrgUnit(m.getOrgUnit().getId());
        checkCanAssignRoleByName(m.getRole());
        m.setEnabled(false);
    }

    /**
     * Ändert eine bestehende Rollenzuweisung (disable alt, assign neu).
     * Niemand kann eine Rolle vergeben, die über seiner eigenen liegt.
     */
    @Transactional
    public OrgUnitMembership changeRole(Long userId, Long membershipId, ChangeRoleRequest req) {
        OrgUnitMembership m = membershipRepository.findById(membershipId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Role assignment not found"));

        if (!m.getUser().getId().equals(userId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Role assignment does not belong to user.");
        }

        adminGuard.requireCanManageOrgUnit(m.getOrgUnit().getId());

        Role newRole;
        try { newRole = Role.valueOf(req.newRole()); }
        catch (IllegalArgumentException e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown role: " + req.newRole());
        }

        checkCanAssignRoleByName(m.getRole());
        checkCanAssignRole(newRole);

        m.setEnabled(false);

        User user = m.getUser();
        return assignRoleInternal(user, new AssignRoleRequest(m.getOrgUnit().getId(), newRole.name()));
    }

    // ── Rollenhierarchie ────────────────────────────────────────────────────────
    // Niemand kann eine Rolle vergeben, die mächtiger ist als seine eigene.
    // TRAEGER_ADMIN > EINRICHTUNG_ADMIN > alle anderen (gleichrangig)

    private static int rolePower(Role role) {
        return switch (role) {
            case TRAEGER_ADMIN    -> 100;
            case EINRICHTUNG_ADMIN -> 90;
            default               -> 50;
        };
    }

    private int callerMaxPower() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return 0;
        int max = 0;
        for (var authority : auth.getAuthorities()) {
            String name = authority.getAuthority();
            if (name.startsWith("ROLE_")) {
                try {
                    Role r = Role.valueOf(name.substring(5));
                    max = Math.max(max, rolePower(r));
                } catch (IllegalArgumentException ignored) { /* unbekannte Rolle */ }
            }
        }
        return max;
    }

    private void checkCanAssignRole(Role targetRole) {
        int callerPower = callerMaxPower();
        int targetPower = rolePower(targetRole);
        if (callerPower < targetPower) {
            throw DomainException.forbidden(
                    ErrorCode.ACCESS_DENIED,
                    "Du kannst keine Rolle vergeben, die über deiner eigenen Berechtigung liegt (" + targetRole.name() + ")."
            );
        }
    }

    private void checkCanAssignRoleByName(String roleName) {
        try {
            checkCanAssignRole(Role.valueOf(roleName));
        } catch (IllegalArgumentException ignored) {
            // Unbekannte Rolle – kein Hierarchy-Check nötig
        }
    }

    private void applyPersonFields(User u, CreateUserRequest req) {
        u.setVorname(trimToNull(req.vorname()));
        u.setNachname(trimToNull(req.nachname()));

        u.setStaatsangehoerigkeitIso2(normalizeIso2(req.staatsangehoerigkeitIso2()));
        u.setStaatsangehoerigkeitSonderfall(parseEnum(
                StaatsangehoerigkeitSonderfall.class,
                req.staatsangehoerigkeitSonderfall(),
                StaatsangehoerigkeitSonderfall.KEINER,
                "Unknown staatsangehoerigkeitSonderfall: "
        ));
        u.setStaatsangehoerigkeitGruppe(parseEnum(
                StaatsangehoerigkeitGruppe.class,
                req.staatsangehoerigkeitGruppe(),
                StaatsangehoerigkeitGruppe.UNBEKANNT,
                "Unknown staatsangehoerigkeitGruppe: "
        ));

        u.setAufenthaltstitelTyp(parseEnumNullable(
                AufenthaltstitelTyp.class,
                req.aufenthaltstitelTyp(),
                "Unknown aufenthaltstitelTyp: "
        ));
        u.setAufenthaltstitelDetails(trimToNull(req.aufenthaltstitelDetails()));

        u.setStrasse(trimToNull(req.strasse()));
        u.setHausnummer(trimToNull(req.hausnummer()));
        u.setPlz(trimToNull(req.plz()));
        u.setOrt(trimToNull(req.ort()));

        u.setTelefon(trimToNull(req.telefon()));
        u.setKontaktEmail(trimToNull(req.kontaktEmail()));

        u.setKommunikationsProfil(toKommunikationsProfil(req.kommunikationsProfil()));
    }

    private KommunikationsProfil toKommunikationsProfil(KommunikationsProfilDto dto) {
        KommunikationsProfil kp = new KommunikationsProfil();

        if (dto == null) {
            return kp;
        }

        kp.setMutterspracheCode(trimToNull(dto.mutterspracheCode()));
        kp.setBevorzugteSpracheCode(trimToNull(dto.bevorzugteSpracheCode()));
        kp.setDolmetschBedarf(parseEnum(
                DolmetschBedarf.class,
                dto.dolmetschBedarf(),
                DolmetschBedarf.UNGEKLAERT,
                "Unknown dolmetschBedarf: "
        ));
        kp.setDolmetschSpracheCode(trimToNull(dto.dolmetschSpracheCode()));
        kp.setHoerStatus(parseEnum(
                HoerStatus.class,
                dto.hoerStatus(),
                HoerStatus.UNBEKANNT,
                "Unknown hoerStatus: "
        ));
        kp.setCodaStatus(parseEnum(
                CodaStatus.class,
                dto.codaStatus(),
                CodaStatus.UNBEKANNT,
                "Unknown codaStatus: "
        ));
        kp.setGebaerdenspracheCode(trimToNull(dto.gebaerdenspracheCode()));
        kp.setKommunikationsHinweise(trimToNull(dto.kommunikationsHinweise()));

        return kp;
    }

    private MitarbeiterFaehigkeiten toMitarbeiterFaehigkeiten(MitarbeiterFaehigkeitenDto dto) {
        MitarbeiterFaehigkeiten mf = new MitarbeiterFaehigkeiten();

        if (dto == null) {
            return mf;
        }

        mf.setKannKinderDolmetschen(Boolean.TRUE.equals(dto.kannKinderDolmetschen()));
        mf.setKannBezugspersonenDolmetschen(Boolean.TRUE.equals(dto.kannBezugspersonenDolmetschen()));
        mf.setHinweise(trimToNull(dto.hinweise()));

        return mf;
    }

    private OrgUnitMembership assignRoleInternal(User user, AssignRoleRequest req) {
        OrgUnit targetOrg = adminGuard.requireCanManageOrgUnit(req.orgUnitId());

        Role role;
        try {
            role = Role.valueOf(req.role());
        } catch (IllegalArgumentException ex) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown role: " + req.role());
        }

        checkCanAssignRole(role);

        return membershipRepository.findByUserIdAndOrgUnitIdAndRole(user.getId(), targetOrg.getId(), role.name())
                .map(existing -> {
                    existing.setEnabled(true);
                    return existing;
                })
                .orElseGet(() -> {
                    OrgUnitMembership m = new OrgUnitMembership();
                    m.setUser(user);
                    m.setOrgUnit(targetOrg);
                    m.setRole(role.name());
                    m.setEnabled(true);
                    return membershipRepository.save(m);
                });
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeIso2(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : trimmed.toUpperCase();
    }

    private <E extends Enum<E>> E parseEnum(
            Class<E> enumClass,
            String rawValue,
            E defaultValue,
            String messagePrefix
    ) {
        String value = trimToNull(rawValue);
        if (value == null) {
            return defaultValue;
        }

        try {
            return Enum.valueOf(enumClass, value);
        } catch (IllegalArgumentException ex) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, messagePrefix + rawValue);
        }
    }

    private <E extends Enum<E>> E parseEnumNullable(
            Class<E> enumClass,
            String rawValue,
            String messagePrefix
    ) {
        String value = trimToNull(rawValue);
        if (value == null) {
            return null;
        }

        try {
            return Enum.valueOf(enumClass, value);
        } catch (IllegalArgumentException ex) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, messagePrefix + rawValue);
        }
    }
}