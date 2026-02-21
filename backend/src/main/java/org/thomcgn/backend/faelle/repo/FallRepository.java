package org.thomcgn.backend.faelle.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.faelle.model.Fall;
import org.thomcgn.backend.faelle.model.FallStatus;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;

public interface FallRepository extends JpaRepository<Fall, Long> {

    @Query("""
    select f from Fall f
    join fetch f.traeger t
    join fetch f.einrichtungOrgUnit e
    left join fetch f.teamOrgUnit team
    join fetch f.createdBy cb
    where f.id = :id
  """)
    Optional<Fall> findByIdWithRefs(@Param("id") Long id);

    @Query("""
    select f from Fall f
    where f.traeger.id = :traegerId
      and (:status is null or f.status = cast(:status as org.thomcgn.backend.faelle.model.FallStatus))
      and (:q is null or lower(f.titel) like lower(concat('%', :q, '%')))
  """)
    Page<Fall> search(@Param("traegerId") Long traegerId,
                      @Param("status") String status,
                      @Param("q") String q,

                      Pageable pageable);

    @Query("""
    select f from Fall f
    join fetch f.createdBy cb
    where f.traeger.id = :traegerId
      and f.einrichtungOrgUnit.id in :einrichtungIds
      and (:status is null or f.status = :status)
      and (:q is null or lower(f.titel) like lower(concat('%', :q, '%')))
    order by f.createdAt desc
  """)
    Page<Fall> searchScoped(@Param("traegerId") Long traegerId,
                            @Param("einrichtungIds") Collection<Long> einrichtungIds,
                            @Param("status") FallStatus status,
                            @Param("q") String q,
                            Pageable pageable);

    @Query("""
  select f from Fall f
  join fetch f.createdBy cb
  where f.traeger.id = :traegerId
    and (:einrichtungen is null or f.einrichtungOrgUnit.id in :einrichtungen)
    and (:status is null or f.status = :status)
    and (:q is null or lower(f.titel) like lower(concat('%', :q, '%')))
  order by f.createdAt desc
""")
    Page<Fall> searchTraegerWide(@Param("traegerId") Long traegerId,
                                 @Param("einrichtungen") Set<Long> einrichtungen,
                                 @Param("status") FallStatus status,
                                 @Param("q") String q,
                                 Pageable pageable);
}