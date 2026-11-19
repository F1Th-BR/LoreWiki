import { Link, useSearchParams } from 'react-router-dom';
import { api, PAGE_TYPES, pageTypeLabel, type PageType } from '../api';
import { SearchBar } from '../components/PageTabs';
import { ErrorBox, Loading } from '../components/Status';
import { useWorld } from '../components/world-context';
import { useAsync } from '../lib/useAsync';

// Resultado de busca por título e conteúdo (RF-20/21/22). Quando a API tiver full-text, basta ela honrar ?q=.
export function SearchPage() {
  const { world } = useWorld();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const type = (params.get('type') as PageType | null) ?? undefined;

  const results = useAsync(() => api.listPages(world.id, { q, type }), [world.id, q, type]);

  return (
    <>
      <SearchBar />
      <article className="panel">
        <h1>Resultados para “{q}”</h1>
        <div className="chips">
          <button className={!type ? 'chip on' : 'chip'} onClick={() => setParams({ q })}>Todos os tipos</button>
          {PAGE_TYPES.map((t) => (
            <button key={t.value} className={type === t.value ? 'chip on' : 'chip'} onClick={() => setParams({ q, type: t.value })}>
              {t.plural}
            </button>
          ))}
        </div>

        {results.loading && <Loading />}
        {results.error && <ErrorBox error={results.error} />}
        {results.data?.length === 0 && <p className="muted">Nada encontrado.</p>}
        <ul className="results">
          {results.data?.map((p) => (
            <li key={p.id}>
              <Link to={`/w/${world.id}/p/${p.slug}`}>{p.title}</Link> <small className="muted">{pageTypeLabel(p.pageType)}</small>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}
