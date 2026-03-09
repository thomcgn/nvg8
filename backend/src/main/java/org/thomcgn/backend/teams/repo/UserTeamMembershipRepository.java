package org.thomcgn.backend.teams.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.thomcgn.backend.teams.model.UserTeamMembership;

import java.util.List;
import java.util.Optional;

public interface UserTeamMembershipRepository extends JpaRepository<UserTeamMembership, Long> {

    Optional<UserTeamMembership> findByUserIdAndTeamOrgUnitId(Long userId, Long teamOrgUnitId);

    List<UserTeamMembership> findByTeamOrgUnitIdAndEnabledTrueOrderByCreatedAtAsc(Long teamOrgUnitId);

    List<UserTeamMembership> findByUserIdAndEnabledTrueOrderByCreatedAtAsc(Long userId);

    List<UserTeamMembership> findByUserIdAndPrimaryTrueAndEnabledTrue(Long userId);
}