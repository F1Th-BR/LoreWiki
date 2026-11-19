import { NavLink } from 'react-router-dom';
import { SearchBox } from './SearchBox';

/** Abas estilo MediaWiki (Ler / Editar / Histórico) + busca. */
export function PageTabs({ base, canEdit }: { base: string; canEdit: boolean }) {
  return (
    <div className="tabs">
      <nav aria-label="Ações da página">
        <NavLink to={base} end>Ler</NavLink>
        {canEdit && <NavLink to={`${base}/edit`}>Editar</NavLink>}
        <NavLink to={`${base}/history`}>Histórico</NavLink>
      </nav>
      <SearchBox />
    </div>
  );
}

/** Barra só com a busca, para páginas que não são uma página da wiki. */
export function SearchBar() {
  return (
    <div className="tabs">
      <span />
      <SearchBox />
    </div>
  );
}
