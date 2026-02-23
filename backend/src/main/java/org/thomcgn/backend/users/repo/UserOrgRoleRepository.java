package org.thomcgn.backend.users.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.users.model.UserOrgRole;

import java.util.List;
import java.util.Optional;

public interface UserOrgRoleRepository extends JpaRepository<UserOrgRole, Long> {

    @Query("""
    select uor
    from UserOrgRole uor
    join fetch uor.orgUnit ou
    join fetch ou.traeger t
    where uor.user.id = :userId
      and uor.enabled = true
      and ou.enabled = true
      and t.enabled = true
  """)
    List<UserOrgRole> findAllActiveByUserId(@Param("userId") Long userId);

    boolean existsByUserIdAndOrgUnitIdAndEnabledTrue(Long userId, Long orgUnitId);

    // contexts = distinct org units the user has any role on
    @Query("""
    select distinct ou
    from UserOrgRole uor
    join uor.orgUnit ou
    join ou.traeger t
    where uor.user.id = :userId
      and uor.enabled = true
      and ou.enabled = true
      and t.enabled = true
    order by ou.type, ou.name
  """)
    List<OrgUnit> findDistinctActiveOrgUnitsForUser(@Param("userId") Long userId);

    Optional<UserOrgRole> findByUserIdAndOrgUnitIdAndRole(Long userId, Long orgUnitId, org.thomcgn.backend.auth.model.Role role);
    List<UserOrgRole> findByUserIdAndEnabledTrue(Long userId);

    @Query("""
        select uor from UserOrgRole uor
        join fetch uor.orgUnit ou
        where uor.user.id = :userId and uor.enabled = true
    """)
    List<UserOrgRole> findAllEnabledWithOrgUnit(@Param("userId") Long userId);
}