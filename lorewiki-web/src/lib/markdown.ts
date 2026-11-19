import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { slugify } from './slug';

/**
 * Conteúdo de uma página = frontmatter opcional + Markdown.
 *
 *   ---
 *   image: https://.../retrato.png     (imagem do infobox)
 *   caption: Legenda da imagem
 *   accent: #d4af37                    (cor do infobox)
 *   Espécie: Humana                    (qualquer outra chave vira uma linha do infobox)
 *   Facção: [[Vanguarda]]
 *   ---
 *   Texto em **Markdown**, com links internos [[Título da página]] ou [[Título|texto]].
 *
 * Tudo vive dentro do campo `content` da página, então o banco não precisa mudar.
 */

const RESERVED = new Set(['image', 'caption', 'accent']);

export interface InfoRow {
  label: string;
  value: string;
}
export interface Frontmatter {
  image?: string;
  caption?: string;
  accent?: string;
  rows: InfoRow[];
}
export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export function parseFrontmatter(src: string): { meta: Frontmatter; body: string } {
  const meta: Frontmatter = { rows: [] };
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta, body: src };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (!value) continue;
    const lower = key.toLowerCase();
    if (RESERVED.has(lower)) (meta as unknown as Record<string, string>)[lower] = value;
    else meta.rows.push({ label: key, value });
  }
  return { meta, body: src.slice(m[0].length) };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface LinkContext {
  worldId: string;
  /** slugs existentes no mundo; links para slugs ausentes ficam vermelhos (como em MediaWiki). */
  slugs: Set<string>;
}

function expandWikiLinks(src: string, ctx: LinkContext): string {
  return src.replace(/\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g, (_, target: string, label?: string) => {
    const t = target.trim();
    const slug = slugify(t);
    const text = esc((label ?? t).trim());
    if (ctx.slugs.has(slug))
      return `<a class="wikilink" href="/w/${ctx.worldId}/p/${slug}">${text}</a>`;
    return `<a class="wikilink redlink" href="/w/${ctx.worldId}/new?title=${encodeURIComponent(t)}" title="Página inexistente">${text}</a>`;
  });
}

let hooked = false;
function sanitize(html: string): string {
  if (!hooked) {
    hooked = true;
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        const href = node.getAttribute('href') ?? '';
        if (/^https?:\/\//i.test(href)) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });
  }
  return DOMPurify.sanitize(html);
}

export function renderBody(body: string, ctx: LinkContext): { html: string; toc: TocItem[] } {
  const raw = marked.parse(expandWikiLinks(body, ctx), { async: false, gfm: true }) as string;
  const clean = sanitize(raw);

  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, 'text/html');
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  doc.querySelectorAll('h2, h3').forEach((h) => {
    const text = h.textContent?.trim() ?? '';
    let id = slugify(text) || 'secao';
    const n = used.get(id) ?? 0;
    used.set(id, n + 1);
    if (n) id = `${id}-${n + 1}`;
    h.id = id;
    toc.push({ id, text, level: h.tagName === 'H2' ? 2 : 3 });
  });
  return { html: doc.body.firstElementChild?.innerHTML ?? clean, toc };
}

export function renderInline(src: string, ctx: LinkContext): string {
  return sanitize(marked.parseInline(expandWikiLinks(src, ctx), { async: false }) as string);
}

/** Texto puro para o trecho de resultado de busca. */
export function excerpt(content: string, q: string, len = 160): string {
  const { body } = parseFrontmatter(content);
  const plain = body.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || a).replace(/[#>*_`\-[\]()]/g, '');
  const i = q ? plain.toLowerCase().indexOf(q.toLowerCase()) : -1;
  const start = Math.max(0, i - 40);
  const s = plain.slice(start, start + len).replace(/\s+/g, ' ').trim();
  return (start > 0 ? '…' : '') + s + (plain.length > start + len ? '…' : '');
}
