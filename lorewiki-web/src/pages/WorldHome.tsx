import { Link } from 'react-router-dom';
import { PAGE_TYPES, pageTypeLabel } from '../api';
import { SearchBar } from '../components/PageTabs';
import { useWorld } from '../components/world-context';
import { fmtDate } from '../lib/useAsync';

/** Página inicial do mundo: índice por tipo (RF-23) e páginas recentes (RF-24). */
export function WorldHome() {
  const { world, pages } = useWorld();
  const base = `/w/${world.id}`;
  const recent = [...pages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);
  const story = pages.find((p) => p.pageType === 'main_story');

  return (
    <>
      <SearchBar />
      <article className="panel">
        <h1>{world.name}</h1>
        <p>{world.description}</p>
        {story && (
          <p>
            Comece por <Link to={`${base}/p/${story.slug}`}>{story.title}</Link>.
          </p>
        )}

        <h2>Explorar por tipo</h2>
        <div className="grid small">
          {PAGE_TYPES.map((t) => {
            const n = pages.filter((p) => p.pageType === t.value).length;
            return n ? (
              <Link key={t.value} className="card" to={`${base}/index?type=${t.value}`}>
                <h3>{t.plural}</h3>
                <p>{n} {n === 1 ? 'página' : 'páginas'}</p>
              </Link>
            ) : null;
          })}
        </div>

        <h2>Modificadas recentemente</h2>
        {recent.length === 0 ? (
          <p className="muted">Ainda não há páginas neste mundo.</p>
        ) : (
          <ul className="plain">
            {recent.map((p) => (
              <li key={p.id}>
                <Link to={`${base}/p/${p.slug}`}>{p.title}</Link>{' '}
                <small className="muted">
                  {pageTypeLabel(p.pageType)} · {fmtDate(p.updatedAt)}
                </small>
              </li>
            ))}
          </ul>
        )}
      </article>
    </>
  );
}
