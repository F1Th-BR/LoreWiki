-- Páginas da wiki
CREATE TABLE IF NOT EXISTS wiki_pages (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id     UUID        NOT NULL REFERENCES worlds(id),
    campaign_id  UUID        NULL REFERENCES campaigns(id),
    page_type    VARCHAR(30) NOT NULL,  -- character, location, event, item...
    title        VARCHAR(300) NOT NULL,
    slug         VARCHAR(300) NOT NULL,  -- URL amigável: 'rei-arthur'
    content      TEXT        NOT NULL DEFAULT '',
    version      INTEGER     NOT NULL DEFAULT 1,  -- para detectar conflitos
    is_draft     BOOLEAN     NOT NULL DEFAULT true,
    created_by   UUID        NOT NULL REFERENCES users(id),
    updated_by   UUID        NOT NULL REFERENCES users(id),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ NULL,
    UNIQUE(world_id, slug)  -- slug único por mundo
);

-- Índice para buscar páginas por mundo rapidamente
CREATE INDEX IF NOT EXISTS idx_pages_world ON wiki_pages(world_id);