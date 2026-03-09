package org.thomcgn.backend.users.dto;

public record MitarbeiterFaehigkeitenDto(
        Boolean kannKinderDolmetschen,
        Boolean kannBezugspersonenDolmetschen,
        String hinweise
) {}