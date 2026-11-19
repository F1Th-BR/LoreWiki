import { useState } from 'react';
import type { TocItem } from '../lib/markdown';

export function Toc({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(true);
  if (items.length < 3) return null;

  let n2 = 0;
  let n3 = 0;
  return (
    <nav className="toc" aria-label="Sumário">
      <button className="toc-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>☰ Sumário</span>
        <span aria-hidden>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <ol>
          {items.map((it) => {
            if (it.level === 2) {
              n2 += 1;
              n3 = 0;
            } else n3 += 1;
            return (
              <li key={it.id} className={it.level === 3 ? 'sub' : undefined}>
                <a href={`#${it.id}`}>
                  <span className="toc-num">{it.level === 2 ? `${n2}.` : `${n2}.${n3}.`}</span> {it.text}
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
