import { Link, useSearchParams } from 'react-router-dom';
import { PAGE_TYPES, pageTypePlural, type PageType } from '../api';
import { SearchBar } from '../components/PageTabs';
import { useWorld } from '../components/world-context';

/** Lista A–Z agrupada por letra inicial, filtrável por tipo (equivale à antiga "Lista de personagens"). */
export function WorldIndex() {
  const { world, pages } = useWorld();
  const [params, setParams] = useSearchParams();
  const type = (params.get('type') as PageType | null) ?? undefined;

  const list = pages.filter((p) => !type || p.pageType === type);
  const groups = new Map<string, typeof list>();
  for (const p of list) {
    const letter = p.title.normalize('NFD').replace(/[̀-ͯ]/g, '')[0]?.toUpperCase() ?? '#';
    const key = /[A-Z]/.test(letter) ? letter : '#';
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const letters = [...groups.keys()].sort();

  return (
    <>
      <SearchBar />
      <article className="panel">
        <h1>{type ? pageTypePlural(type) : 'Todas as páginas'}</h1>
        <div className="chips" role="group" aria-label="Filtrar por tipo">
          <button className={!type ? 'chip on' : 'chip'} onClick={() => setParams({})}>Todas</button>
          {PAGE_TYPES.map((t) => (
            <button
              key={t.value}
              className={type === t.value ? 'chip on' : 'chip'}
              onClick={() => setParams({ type: t.value })}
            >
              {t.plural}
            </button>
          ))}
        </div>

        {list.length === 0 && <p className="muted">Nenhuma página aqui ainda.</p>}
        {letters.map((l) => (
          <section key={l}>
            <h2 className="letter">{l}</h2>
            <ul className="plain">
              {groups.get(l)!.map((p) => (
                <li key={p.id}>
                  <Link to={`/w/${world.id}/p/${p.slug}`}>{p.title}</Link>
                  {p.isDraft && <span className="pill">rascunho</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </>
  );
}
