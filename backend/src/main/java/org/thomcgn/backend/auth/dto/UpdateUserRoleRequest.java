package org.thomcgn.backend.auth.dto;

import org.thomcgn.backend.auth.data.Role;

public record UpdateUserRoleRequest(Role role) {}