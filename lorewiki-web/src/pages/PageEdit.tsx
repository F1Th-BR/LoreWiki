import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, ConflictError, PAGE_TYPES, type PageDetail, type PageType } from '../api';
import { useAuth } from '../auth/AuthContext';
import { DiffView } from '../components/DiffView';
import { PageBody } from '../components/PageBody';
import { PageTabs, SearchBar } from '../components/PageTabs';
import { ErrorBox, Loading } from '../components/Status';
import { useWorld } from '../components/world-context';
import { slugify } from '../lib/slug';
import { useAsync } from '../lib/useAsync';

const INFOBOX_TEMPLATE = `---
image: https://
caption: Legenda
Espécie:
Estado:
---
`;

/** Editor com preview em tempo real (RF-08). Serve para criar (/new) e editar (/p/:slug/edit). */
export function PageEdit({ mode }: { mode: 'new' | 'edit' }) {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { world } = useWorld();
  if (!user) return <div className="panel"><p>Você precisa <a href="/login">entrar</a> para editar.</p></div>;
  return mode === 'edit' ? <EditExisting key={slug} slug={slug} worldId={world.id} /> : <Editor worldId={world.id} />;
}

function EditExisting({ slug, worldId }: { slug: string; worldId: string }) {
  const page = useAsync(() => api.getPage(worldId, slug), [worldId, slug]);
  if (page.loading) return <Loading />;
  if (page.error) return <div className="panel"><ErrorBox error={page.error} /></div>;
  return <Editor worldId={worldId} page={page.data!} />;
}

function Editor({ worldId, page }: { worldId: string; page?: PageDetail }) {
  const navigate = useNavigate();
  const { refresh, pages, slugs } = useWorld();
  const [params] = useSearchParams();

  const [title, setTitle] = useState(page?.title ?? params.get('title') ?? '');
  const [pageType, setPageType] = useState<PageType>(page?.pageType ?? 'other');
  const [content, setContent] = useState(page?.content ?? '');
  const [isDraft, setIsDraft] = useState(page?.isDraft ?? false);
  const [summary, setSummary] = useState('');
  const [version, setVersion] = useState(page?.version ?? 0);
  const [error, setError] = useState<Error>();
  const [conflict, setConflict] = useState<PageDetail>();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  const savedRef = useRef(false); // lido pelo bloqueador de navegação sem esperar um novo render
  const dirty = !saved && (content !== (page?.content ?? '') || (!page && title !== ''));

  // Avisa antes de perder alterações (troca de rota ou fechar a aba).
  const blocker = useBlocker(() => dirty && !savedRef.current);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Você tem alterações não salvas. Sair mesmo assim?')) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  // No preview, a própria página (ainda inexistente) não deve aparecer como link vermelho.
  const previewSlugs = useMemo(() => {
    const s = new Set(slugs);
    if (title) s.add(slugify(title));
    return s;
  }, [slugs, title]);

  const existingSlug = page?.slug;
  const duplicate = !page && !!title && pages.some((p) => p.slug === slugify(title));

  const insert = (before: string, after = '', placeholder = '') => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = content.slice(s, e) || placeholder;
    const next = content.slice(0, s) + before + sel + after + content.slice(e);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  };

  const save = async (e?: FormEvent, forceVersion?: number) => {
    e?.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const result = page
        ? await api.updatePage(worldId, existingSlug!, {
            content,
            isDraft,
            summary: summary.trim() || undefined,
            version: forceVersion ?? version,
          })
        : await api.createPage(worldId, { title: title.trim(), pageType, content, isDraft, summary: summary.trim() || undefined });
      savedRef.current = true;
      setSaved(true);
      refresh();
      navigate(`/w/${worldId}/p/${result.slug}`);
    } catch (err) {
      if (err instanceof ConflictError && page) {
        // RN-11: não descarta nada em silêncio; mostra o diff e deixa a pessoa decidir.
        try {
          setConflict(await api.getPage(worldId, existingSlug!));
        } catch (e2) {
          setError(e2 as Error);
        }
      } else setError(err as Error);
      setBusy(false);
    }
  };

  return (
    <>
      {page ? <PageTabs base={`/w/${worldId}/p/${page.slug}`} canEdit={page.canEdit} /> : <SearchBar />}
      <form className="panel editor" onSubmit={(e) => save(e)}>
        <h1>{page ? `Editando: ${page.title}` : 'Nova página'}</h1>
        {page && !page.canEdit && <div className="notice notice-error">Você não tem permissão para editar esta página.</div>}
        {error && <ErrorBox error={error} />}

        {conflict && (
          <div className="notice notice-error" role="alert">
            <strong>Conflito de edição.</strong> Outra pessoa salvou esta página enquanto você editava (versão {conflict.version}
            {conflict.updatedByName ? `, por ${conflict.updatedByName}` : ''}). Abaixo, o que mudou entre a versão atual e a sua:
            <DiffView before={conflict.content} after={content} />
            <div className="row">
              <button type="button" className="btn" onClick={() => save(undefined, conflict.version)} disabled={busy}>
                Salvar a minha versão por cima
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setContent(conflict.content);
                  setVersion(conflict.version);
                  setConflict(undefined);
                }}
              >
                Carregar a versão atual (descarta a minha)
              </button>
              <button type="button" className="link-btn" onClick={() => { setVersion(conflict.version); setConflict(undefined); }}>
                Continuar editando
              </button>
            </div>
          </div>
        )}

        <div className="row wrap">
          <label className="grow">
            Título
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} disabled={!!page} />
            {duplicate && <small className="warn-text">Já existe uma página com esse título.</small>}
            {!page && title && !duplicate && <small className="muted">Endereço: /p/{slugify(title)}</small>}
          </label>
          <label>
            Tipo
            <select value={pageType} onChange={(e) => setPageType(e.target.value as PageType)} disabled={!!page}>
              {PAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
        </div>

        <div className="toolbar" role="toolbar" aria-label="Formatação">
          <button type="button" onClick={() => insert('**', '**', 'negrito')}><b>B</b></button>
          <button type="button" onClick={() => insert('*', '*', 'itálico')}><i>I</i></button>
          <button type="button" onClick={() => insert('\n## ', '\n', 'Título da seção')}>H2</button>
          <button type="button" onClick={() => insert('\n### ', '\n', 'Subseção')}>H3</button>
          <button type="button" onClick={() => insert('- ', '', 'item')}>• Lista</button>
          <button type="button" onClick={() => insert('> ', '', 'citação')}>❝</button>
          <button type="button" onClick={() => insert('[[', ']]', 'Nome da página')}>[[Link]]</button>
          {!content.startsWith('---') && (
            <button type="button" onClick={() => setContent(INFOBOX_TEMPLATE + content)}>＋ Infobox</button>
          )}
        </div>

        <div className="split">
          <label>
            Conteúdo (Markdown)
            <textarea ref={area} value={content} onChange={(e) => setContent(e.target.value)} spellCheck rows={22} />
          </label>
          <div>
            <div className="preview-label">Pré-visualização</div>
            <div className="preview">
              <PageBody title={title || 'Sem título'} content={content} slugs={previewSlugs} />
            </div>
          </div>
        </div>

        <div className="row wrap">
          <label className="grow">
            Resumo da edição <small className="muted">(opcional)</small>
            <input value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} placeholder="O que você mudou?" />
          </label>
          <label className="check">
            <input type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} />
            Rascunho (visível só a quem pode editar)
          </label>
        </div>

        <div className="row">
          <button className="btn" disabled={busy || !title.trim() || duplicate || (!!page && !page.canEdit)}>
            {busy ? 'Salvando…' : 'Salvar página'}
          </button>
          <button type="button" className="btn secondary" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </>
  );
}
