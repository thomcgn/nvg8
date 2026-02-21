package org.thomcgn.backend.aktenzeichen.repo;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.thomcgn.backend.aktenzeichen.model.TraegerAktennummerSequence;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface TraegerAktennummerSequenceRepository extends JpaRepository<TraegerAktennummerSequence, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    select s from TraegerAktennummerSequence s
    where s.traegerId = :traegerId and s.year = :year
  """)
    Optional<TraegerAktennummerSequence> findForUpdate(@Param("traegerId") Long traegerId,
                                                       @Param("year") int year);
}