package org.thomcgn.backend.orgunits.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitMembership;

import java.util.List;
import java.util.Optional;

public interface OrgUnitMembershipRepository extends JpaRepository<OrgUnitMembership, Long> {

    // ── Role-based lookups ───────────────────────────────────────────────────

    Optional<OrgUnitMembership> findByUserIdAndOrgUnitIdAndRole(Long userId, Long orgUnitId, String role);

    @Query("""
        select m from OrgUnitMembership m
        join fetch m.orgUnit ou
        join fetch ou.traeger t
        where m.user.id = :userId
          and m.role is not null
          and m.enabled = true
          and ou.enabled = true
          and t.enabled = true
    """)
    List<OrgUnitMembership> findAllActiveRolesByUserId(@Param("userId") Long userId);

    @Query("""
        select distinct ou
        from OrgUnitMembership m
        join m.orgUnit ou
        join ou.traeger t
        where m.user.id = :userId
          and m.role is not null
          and m.enabled = true
          and ou.enabled = true
          and t.enabled = true
        order by ou.type, ou.name
    """)
    List<OrgUnit> findDistinctActiveRoleOrgUnitsForUser(@Param("userId") Long userId);

    @Query("""
        select m from OrgUnitMembership m
        join fetch m.user u
        where m.orgUnit.id = :orgUnitId
          and m.role is not null
          and m.enabled = true
          and u.enabled = true
    """)
    List<OrgUnitMembership> findAllEnabledRolesByOrgUnitId(@Param("orgUnitId") Long orgUnitId);

    // ── All-member lookups (roles + memberships) ──────────────────────────────

    @Query("""
        select m from OrgUnitMembership m
        join fetch m.user u
        where m.orgUnit.id = :orgUnitId
          and m.enabled = true
          and u.enabled = true
    """)
    List<OrgUnitMembership> findAllEnabledByOrgUnitId(@Param("orgUnitId") Long orgUnitId);

    // ── Team membership lookups ───────────────────────────────────────────────

    Optional<OrgUnitMembership> findByUserIdAndOrgUnitIdAndRoleIsNull(Long userId, Long orgUnitId);

    List<OrgUnitMembership> findByOrgUnitIdAndMembershipTypeIsNotNullAndEnabledTrueOrderByCreatedAtAsc(Long orgUnitId);

    List<OrgUnitMembership> findByUserIdAndMembershipTypeIsNotNullAndEnabledTrueOrderByCreatedAtAsc(Long userId);

    List<OrgUnitMembership> findByUserIdAndPrimaryTrueAndEnabledTrue(Long userId);

    // ── Existence checks ──────────────────────────────────────────────────────

    boolean existsByUserIdAndOrgUnitIdAndEnabledTrue(Long userId, Long orgUnitId);
}
