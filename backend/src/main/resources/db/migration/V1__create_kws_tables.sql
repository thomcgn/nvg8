-- V1__create_kws_tables.sql
create table if not exists kws_template (
                                            id bigserial primary key,
                                            code text not null,
                                            title text not null,
                                            version text not null,
                                            min_age_months int,
                                            max_age_months int,
                                            audience text,
                                            active boolean not null default true,
                                            created_at timestamptz not null default now(),
                                            updated_at timestamptz not null default now()
);

create unique index if not exists ux_kws_template_code on kws_template(code);

create table if not exists kws_template_section (
                                                    id bigserial primary key,
                                                    template_id bigint not null references kws_template(id) on delete cascade,
                                                    section_key text not null,
                                                    title text not null,
                                                    sort int not null
);

-- strongly recommended so you can use ON CONFLICT here too
create unique index if not exists ux_kws_template_section
    on kws_template_section(template_id, section_key);

create table if not exists kws_template_item (
                                                 id bigserial primary key,
                                                 section_id bigint not null references kws_template_section(id) on delete cascade,
                                                 item_key text not null,
                                                 label text not null,
                                                 answer_type text not null,
                                                 sort int not null
);

create unique index if not exists ux_kws_template_item
    on kws_template_item(section_id, item_key);