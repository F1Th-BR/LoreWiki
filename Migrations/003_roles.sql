-- Papéis (RBAC): define quem pode fazer o quê e onde
-- scope_type: 'world' ou 'campaign'
-- role_type:  'visitor', 'player', 'master', 'creator'
CREATE TABLE IF NOT EXISTS roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id),
    role_type   VARCHAR(20) NOT NULL,
    scope_type  VARCHAR(20) NOT NULL,
    scope_id    UUID        NOT NULL,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, scope_type, scope_id)  -- um papel por escopo
);