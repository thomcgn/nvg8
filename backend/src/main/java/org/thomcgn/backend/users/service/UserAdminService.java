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
    public UserOrgRole assignRole(Long userId, AssignRoleRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        return assignRoleInternal(user, req);
    }

    @Transactional
    public void disableRole(Long userId, Long userOrgRoleId) {
        UserOrgRole uor = userOrgRoleRepository.findById(userOrgRoleId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Role assignment not found"));

        if (!uor.getUser().getId().equals(userId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Role assignment does not belong to user.");
        }

        adminGuard.requireCanManageOrgUnit(uor.getOrgUnit().getId());
        uor.setEnabled(false);
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

    private UserOrgRole assignRoleInternal(User user, AssignRoleRequest req) {
        OrgUnit targetOrg = adminGuard.requireCanManageOrgUnit(req.orgUnitId());

        Role role;
        try {
            role = Role.valueOf(req.role());
        } catch (IllegalArgumentException ex) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown role: " + req.role());
        }

        return userOrgRoleRepository.findByUserIdAndOrgUnitIdAndRole(user.getId(), targetOrg.getId(), role)
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