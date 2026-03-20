package org.thomcgn.backend.people.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class BezugspersonBeziehungTest {

    // --- valid enum values pass through unchanged ---

    @Test
    void fromStringOrSonstige_returnsMatchingConstant_forAllValidValues() {
        for (BezugspersonBeziehung value : BezugspersonBeziehung.values()) {
            assertThat(BezugspersonBeziehung.fromStringOrSonstige(value.name()))
                    .isEqualTo(value);
        }
    }

    // --- unknown / legacy strings map to SONSTIGE ---

    @ParameterizedTest
    @ValueSource(strings = {"TANTE", "ONKEL", "BRUDER", "SCHWESTER", "FREUND", "UNKNOWN", "foo", "123"})
    void fromStringOrSonstige_returnsSonstige_forUnknownValues(String unknown) {
        assertThat(BezugspersonBeziehung.fromStringOrSonstige(unknown))
                .isEqualTo(BezugspersonBeziehung.SONSTIGE);
    }

    // --- null / blank / empty map to SONSTIGE ---

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "\t", "\n"})
    void fromStringOrSonstige_returnsSonstige_forNullOrBlank(String input) {
        assertThat(BezugspersonBeziehung.fromStringOrSonstige(input))
                .isEqualTo(BezugspersonBeziehung.SONSTIGE);
    }

    // --- whitespace trimming ---

    @Test
    void fromStringOrSonstige_trimsWhitespace_beforeParsing() {
        assertThat(BezugspersonBeziehung.fromStringOrSonstige("  MUTTER  "))
                .isEqualTo(BezugspersonBeziehung.MUTTER);
    }
}
