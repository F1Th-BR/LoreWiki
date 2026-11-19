import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { api, PAGE_TYPES } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../lib/useAsync';
import { ErrorBox, Loading } from './Status';
import { WorldContext } from './world-context';

/** Moldura de uma wiki: banner do mundo + barra lateral de navegação. Carrega mundo e lista de páginas. */
export function WorldLayout() {
  const { worldId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  const world = useAsync(() => api.getWorld(worldId), [worldId, user?.id]);
  const pages = useAsync(() => api.listPages(worldId), [worldId, user?.id]);

  const slugs = useMemo(() => new Set((pages.data ?? []).map((p) => p.slug)), [pages.data]);
  const counts = useMemo(() => {
    const c = new Map<string, number>();
    (pages.data ?? []).forEach((p) => c.set(p.pageType, (c.get(p.pageType) ?? 0) + 1));
    return c;
  }, [pages.data]);

  if (world.error) return <div className="container"><ErrorBox error={world.error} /></div>;
  if (!world.data || !pages.data) return <div className="container"><Loading /></div>;

  const w = world.data;
  const isCreator = user?.id === w.creatorId;
  const base = `/w/${w.id}`;

  const random = () => {
    const list = pages.data!;
    if (list.length) navigate(`${base}/p/${list[Math.floor(Math.random() * list.length)].slug}`);
  };

  return (
    <WorldContext.Provider value={{ world: w, pages: pages.data, slugs, refresh: pages.reload }}>
      <div className="banner">
        <Link to={base} className="banner-title">
          {w.name}
        </Link>
        {w.description && <p className="banner-sub">{w.description}</p>}
      </div>

      <div className="wiki-shell">
        <button className="menu-toggle" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
          ☰ Menu
        </button>

        <aside className={`sidebar${menu ? ' open' : ''}`} onClick={() => setMenu(false)}>
          <section>
            <h3>Navegação</h3>
            <ul>
              <li><NavLink to={base} end>Página inicial</NavLink></li>
              <li><NavLink to={`${base}/index`} end>Todas as páginas</NavLink></li>
              <li><button className="link-btn" onClick={random}>Página aleatória</button></li>
              {isCreator && <li><NavLink to={`${base}/new`}>＋ Nova página</NavLink></li>}
            </ul>
          </section>
          <section>
            <h3>Wiki</h3>
            <ul>
              {PAGE_TYPES.filter((t) => counts.get(t.value)).map((t) => (
                <li key={t.value}>
                  <NavLink to={`${base}/index?type=${t.value}`}>
                    {t.plural} <small>{counts.get(t.value)}</small>
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Outros mundos</h3>
            <ul>
              <li><Link to="/">Ver todos os mundos</Link></li>
            </ul>
          </section>
        </aside>

        <main className="wiki-main">
          <Outlet />
        </main>
      </div>
    </WorldContext.Provider>
  );
}
