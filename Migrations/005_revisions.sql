-- Revisões: histórico imutável de todas as edições
-- Esta tabela NUNCA recebe UPDATE ou DELETE
CREATE TABLE IF NOT EXISTS revisions (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id        UUID        NOT NULL REFERENCES wiki_pages(id),
    user_id        UUID        NOT NULL REFERENCES users(id),
    content_before TEXT        NOT NULL,  -- como estava antes
    content_after  TEXT        NOT NULL,  -- como ficou depois
    summary        VARCHAR(500) NULL,      -- resumo opcional do editor
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para buscar histórico de uma página rapidamente
CREATE INDEX IF NOT EXISTS idx_revisions_page
    ON revisions(page_id, created_at DESC);

-- Regras que proíbem UPDATE e DELETE nesta tabela
CREATE OR REPLACE RULE sem_update_revisoes AS
    ON UPDATE TO revisions DO INSTEAD NOTHING;
CREATE OR REPLACE RULE sem_delete_revisoes AS
    ON DELETE TO revisions DO INSTEAD NOTHING;