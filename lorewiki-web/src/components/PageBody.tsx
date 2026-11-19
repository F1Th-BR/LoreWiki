import { useMemo } from 'react';
import { parseFrontmatter, renderBody } from '../lib/markdown';
import { Infobox } from './Infobox';
import { Html } from './Markdown';
import { Toc } from './Toc';
import { useWorld } from './world-context';

/** Corpo de uma página: infobox à direita, sumário, texto. Usado na leitura e no preview do editor. */
export function PageBody({ title, content, slugs }: { title: string; content: string; slugs?: Set<string> }) {
  const { world, slugs: worldSlugs } = useWorld();
  const known = slugs ?? worldSlugs;
  const ctx = useMemo(() => ({ worldId: world.id, slugs: known }), [world.id, known]);

  const { meta, html, toc } = useMemo(() => {
    const { meta, body } = parseFrontmatter(content);
    return { meta, ...renderBody(body, ctx) };
  }, [content, ctx]);

  return (
    <div className="page-body">
      <Infobox title={title} meta={meta} ctx={ctx} />
      <Toc items={toc} />
      {html.trim() ? <Html html={html} /> : <p className="muted">Esta página ainda não tem conteúdo.</p>}
    </div>
  );
}
