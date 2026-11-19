import { createContext, useContext } from 'react';
import type { PageSummary, World } from '../api';

export interface WorldCtx {
  world: World;
  pages: PageSummary[];
  slugs: Set<string>;
  /** Recarrega a lista de páginas (após criar/editar). */
  refresh: () => void;
}

export const WorldContext = createContext<WorldCtx | null>(null);

export function useWorld() {
  const v = useContext(WorldContext);
  if (!v) throw new Error('useWorld fora do WorldLayout');
  return v;
}
