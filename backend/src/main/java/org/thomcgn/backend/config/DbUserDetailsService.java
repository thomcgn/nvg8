package org.thomcgn.backend.config;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.ArrayList;
import java.util.List;

@Service
public class DbUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public DbUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        if (!user.isEnabled()) {
            throw new UsernameNotFoundException("User disabled: " + email);
        }

        // Authorities: aus UserOrgRole (enabled=true)
        List<GrantedAuthority> auth = new ArrayList<>();
        user.getOrgRoles().stream()
                .filter(r -> r != null && r.isEnabled() && r.getRole() != null)
                .forEach(r -> auth.add(new SimpleGrantedAuthority("ROLE_" + r.getRole().name())));

        // Fallback (damit nie leer, optional)
        if (auth.isEmpty()) {
            auth.add(new SimpleGrantedAuthority("ROLE_LESEN"));
        }

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(auth)
                .accountLocked(false)
                .disabled(!user.isEnabled())
                .build();
    }
}