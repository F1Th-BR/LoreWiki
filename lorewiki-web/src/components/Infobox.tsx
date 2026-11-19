import { useMemo } from 'react';
import { renderInline, type Frontmatter, type LinkContext } from '../lib/markdown';
import { Html } from './Markdown';

export function Infobox({
  title,
  meta,
  ctx,
}: {
  title: string;
  meta: Frontmatter;
  ctx: LinkContext;
}) {
  const rows = useMemo(
    () => meta.rows.map((r) => ({ label: r.label, html: renderInline(r.value, ctx) })),
    [meta.rows, ctx],
  );
  if (!meta.image && rows.length === 0) return null;

  return (
    <aside className="infobox" style={meta.accent ? ({ '--box': meta.accent } as React.CSSProperties) : undefined}>
      <div className="infobox-title">{title}</div>
      {meta.image && (
        <figure>
          <img src={meta.image} alt={meta.caption ?? title} loading="lazy" />
          {meta.caption && <figcaption>{meta.caption}</figcaption>}
        </figure>
      )}
      {rows.length > 0 && (
        <>
          <div className="infobox-sub">Informações gerais</div>
          <dl>
            {rows.map((r) => (
              <div key={r.label} className="infobox-row">
                <dt>{r.label}</dt>
                <dd>
                  <Html html={r.html} inline />
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </aside>
  );
}
