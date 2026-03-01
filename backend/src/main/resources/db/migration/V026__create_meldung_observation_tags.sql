-- V026__create_meldung_observation_tags.sql

create table if not exists meldung_observation_tags (
                                                        id bigserial primary key,

                                                        observation_id bigint not null
                                                            references meldung_observations(id)
                                                                on delete restrict,

                                                        anlass_code varchar(100),
                                                        indicator_id varchar(100),
                                                        severity int,
                                                        comment varchar(2000)
);

create index if not exists ix_meldung_tag_observation
    on meldung_observation_tags (observation_id);

create index if not exists ix_meldung_tag_anlass
    on meldung_observation_tags (anlass_code);

create index if not exists ix_meldung_tag_indicator
    on meldung_observation_tags (indicator_id);