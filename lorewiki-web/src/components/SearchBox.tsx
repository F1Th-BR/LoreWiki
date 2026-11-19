import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pageTypeLabel } from '../api';
import { slugify } from '../lib/slug';
import { useWorld } from './world-context';

/** Busca por título com autocomplete (RF-20). Enter abre a busca completa (título + conteúdo). */
export function SearchBox() {
  const { world, pages } = useWorld();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const n = slugify(q);
    if (!n) return [];
    return pages
      .filter((p) => slugify(p.title).includes(n))
      .sort((a, b) => Number(slugify(b.title).startsWith(n)) - Number(slugify(a.title).startsWith(n)))
      .slice(0, 8);
  }, [q, pages]);

  const go = (slug: string) => {
    setQ('');
    setOpen(false);
    ref.current?.blur();
    navigate(`/w/${world.id}/p/${slug}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && matches[active]) go(matches[active].slug);
      else if (q.trim()) {
        setOpen(false);
        navigate(`/w/${world.id}/search?q=${encodeURIComponent(q.trim())}`);
      }
    }
  };

  return (
    <div className="search" role="search">
      <input
        ref={ref}
        type="search"
        value={q}
        placeholder={`Pesquisar em ${world.name}`}
        aria-label="Pesquisar"
        aria-autocomplete="list"
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKey}
      />
      {open && matches.length > 0 && (
        <ul className="search-pop" role="listbox">
          {matches.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === active}>
              <button
                className={i === active ? 'active' : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(p.slug)}
              >
                {p.title} <small>{pageTypeLabel(p.pageType)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
