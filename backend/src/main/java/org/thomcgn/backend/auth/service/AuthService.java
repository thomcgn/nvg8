package org.thomcgn.backend.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.auth.dto.AvailableContextDto;
import org.thomcgn.backend.auth.dto.LoginRequest;
import org.thomcgn.backend.auth.dto.LoginResponse;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.model.UserOrgRole;
import org.thomcgn.backend.users.repo.UserOrgRoleRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserOrgRoleRepository userOrgRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            UserOrgRoleRepository userOrgRoleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.userOrgRoleRepository = userOrgRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email())
                .filter(User::isEnabled)
                .orElseThrow(() -> DomainException.unauthorized(
                        ErrorCode.AUTH_INVALID_CREDENTIALS,
                        "Invalid email or password"
                ));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw DomainException.unauthorized(
                    ErrorCode.AUTH_INVALID_CREDENTIALS,
                    "Invalid email or password"
            );
        }

        String baseToken = jwtService.issueBaseToken(user.getId(), user.getEmail());

        List<AvailableContextDto> contexts = userOrgRoleRepository.findAllActiveByUserId(user.getId())
                .stream()
                .map(this::toContextDto)
                .toList();

        return new LoginResponse(baseToken, contexts);
    }

    private AvailableContextDto toContextDto(UserOrgRole uor) {
        return new AvailableContextDto(
                uor.getOrgUnit().getTraeger().getId(),
                uor.getOrgUnit().getTraeger().getName(),
                uor.getOrgUnit().getId(),
                uor.getOrgUnit().getType().name(),
                uor.getOrgUnit().getName()
        );
    }
}