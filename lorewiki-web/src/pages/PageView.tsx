import { Link, useParams } from 'react-router-dom';
import { api, ApiError, pageTypeLabel } from '../api';
import { useAuth } from '../auth/AuthContext';
import { PageBody } from '../components/PageBody';
import { PageTabs } from '../components/PageTabs';
import { ErrorBox, Loading } from '../components/Status';
import { useWorld } from '../components/world-context';
import { fmtDate, useAsync } from '../lib/useAsync';

export function PageView() {
  const { world } = useWorld();
  const { user } = useAuth();
  const { slug = '' } = useParams();
  const base = `/w/${world.id}/p/${slug}`;
  const page = useAsync(() => api.getPage(world.id, slug), [world.id, slug, user?.id]);

  if (page.loading && !page.data) return <Loading />;

  if (page.error) {
    const notFound = page.error instanceof ApiError && page.error.status === 404;
    return (
      <>
        <PageTabs base={base} canEdit={false} />
        <article className="panel">
          {notFound ? (
            <>
              <h1>Página não encontrada</h1>
              <p>Ainda não existe uma página com esse endereço neste mundo.</p>
              {user && (
                <Link className="btn" to={`/w/${world.id}/new?title=${encodeURIComponent(slug.replace(/-/g, ' '))}`}>
                  Criar esta página
                </Link>
              )}
            </>
          ) : (
            <ErrorBox error={page.error} />
          )}
        </article>
      </>
    );
  }

  const p = page.data!;
  return (
    <>
      <PageTabs base={base} canEdit={p.canEdit} />
      <article className="panel">
        <header className="page-head">
          <h1>{p.title}</h1>
          <span className="pill">{pageTypeLabel(p.pageType)}</span>
          {p.isDraft && <span className="pill warn">rascunho</span>}
        </header>
        <PageBody title={p.title} content={p.content} />
        <footer className="page-foot">
          Última edição {p.updatedByName ? <>por <strong>{p.updatedByName}</strong> </> : null}em {fmtDate(p.updatedAt)} ·{' '}
          <Link to={`${base}/history`}>ver histórico</Link>
        </footer>
      </article>
    </>
  );
}
