import { http } from './http';
import type { Api, World } from './types';

/**
 * Cliente da API .NET.
 *
 * JÁ EXISTEM na API: POST /auth/login, POST /auth/register, GET /worlds, POST /worlds.
 * AINDA NÃO EXISTEM (contrato proposto em docs/API_CONTRACT.md): GET /worlds/{id},
 * e tudo de páginas e revisões. Até lá, use VITE_API_MODE=mock.
 */
export const realApi: Api = {
  login: (email, password) =>
    http('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: async (username, email, password) => {
    await http('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  listWorlds: () => http<World[]>('/worlds'),

  // A API ainda não tem GET /worlds/{id}; enquanto isso, filtramos a listagem pública.
  getWorld: async (id) => {
    const worlds = await http<World[]>('/worlds');
    const w = worlds.find((x) => x.id === id);
    if (!w) throw new Error('Mundo não encontrado.');
    return w;
  },

  createWorld: (input) => http('/worlds', { method: 'POST', body: JSON.stringify(input) }),

  listPages: (worldId, opts = {}) => {
    const qs = new URLSearchParams();
    if (opts.type) qs.set('type', opts.type);
    if (opts.q) qs.set('q', opts.q);
    const s = qs.toString();
    return http(`/worlds/${worldId}/pages${s ? `?${s}` : ''}`);
  },

  getPage: (worldId, slug) => http(`/worlds/${worldId}/pages/${encodeURIComponent(slug)}`),

  createPage: (worldId, input) =>
    http(`/worlds/${worldId}/pages`, { method: 'POST', body: JSON.stringify(input) }),

  updatePage: (worldId, slug, input) =>
    http(`/worlds/${worldId}/pages/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  listRevisions: (worldId, slug) =>
    http(`/worlds/${worldId}/pages/${encodeURIComponent(slug)}/revisions`),

  restoreRevision: (worldId, slug, revisionId) =>
    http(`/worlds/${worldId}/pages/${encodeURIComponent(slug)}/revisions/${revisionId}/restore`, {
      method: 'POST',
    }),
};
