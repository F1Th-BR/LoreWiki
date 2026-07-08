-- Biblioteca de imagens: o arquivo em si, independente de onde é usado
-- Modelo inspirado no MediaWiki: uma imagem existe por si só,
-- e pode ser referenciada por múltiplas páginas sem duplicação.
CREATE TABLE IF NOT EXISTS images (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by   UUID        NOT NULL REFERENCES users(id),
    url           VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) NOT NULL,
    mime_type     VARCHAR(50) NOT NULL,
    size_bytes    INTEGER     NOT NULL,
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Onde cada imagem é usada: permite que a mesma imagem apareça
-- em N páginas diferentes (ex: ícone de facção usado em vários personagens)
CREATE TABLE IF NOT EXISTS page_images (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id    UUID        NOT NULL REFERENCES wiki_pages(id),
    image_id   UUID        NOT NULL REFERENCES images(id),
    role       VARCHAR(30) NOT NULL DEFAULT 'gallery',  -- 'portrait', 'icon', 'gallery'
    sort_order INTEGER     NOT NULL DEFAULT 0,
    UNIQUE(page_id, image_id, role)
);

-- Índices para as duas consultas mais comuns:
-- "quais imagens essa página usa" e "em quais páginas essa imagem aparece"
CREATE INDEX IF NOT EXISTS idx_page_images_page ON page_images(page_id);
CREATE INDEX IF NOT EXISTS idx_page_images_image ON page_images(image_id);