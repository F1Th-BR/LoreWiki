-- Mundos: o universo fictício criado pelo usuário
CREATE TABLE IF NOT EXISTS worlds (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id  UUID        NOT NULL REFERENCES users(id),
    name        VARCHAR(200) NOT NULL,
    description TEXT        NULL,
    is_public   BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campanhas: histórias que acontecem dentro de um mundo
CREATE TABLE IF NOT EXISTS campaigns (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id    UUID        NOT NULL REFERENCES worlds(id),
    master_id   UUID        NOT NULL REFERENCES users(id),
    name        VARCHAR(200) NOT NULL,
    started_at  TIMESTAMPTZ NULL,
    ended_at    TIMESTAMPTZ NULL
);