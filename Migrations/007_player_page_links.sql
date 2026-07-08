-- Vínculo entre jogador e as páginas que ele pode editar
CREATE TABLE IF NOT EXISTS player_page_links (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id   UUID        NOT NULL REFERENCES users(id),
    page_id     UUID        NOT NULL REFERENCES wiki_pages(id),
    campaign_id UUID        NOT NULL REFERENCES campaigns(id),
    linked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, page_id)  -- um vínculo por par jogador-página
);