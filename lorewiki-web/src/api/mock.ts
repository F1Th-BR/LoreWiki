import { ApiError, ConflictError, TOKEN_KEY } from './http';
import { DEMO_USER, SEED_PAGES, SEED_WORLD } from './seed';
import type { Api, PageDetail, PageSummary, Revision, WikiPage, World } from './types';
import { b64urlEncode, CLAIM_EMAIL, CLAIM_ID, userFromToken } from '../auth/token';
import { slugify } from '../lib/slug';

/**
 * API falsa que roda 100% no navegador (localStorage). Permite desenvolver e testar o front
 * enquanto a API .NET não tem os endpoints de páginas. Login de teste: demo@lorewiki.dev / demo1234.
 * Regras implementadas: criador do mundo edita/restaura tudo; visitantes só leem páginas publicadas;
 * conflito de versão (409); revisões imutáveis; restauração cria nova revisão.
 */

interface MockUser {
  id: string;
  username: string;
  email: string;
  password: string;
}
interface State {
  users: MockUser[];
  worlds: World[];
  pages: WikiPage[];
  revisions: Revision[];
}

const KEY = 'lorewiki.mock.v1';

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* cai no seed */
  }
  const s: State = {
    users: [DEMO_USER],
    worlds: [SEED_WORLD],
    pages: SEED_PAGES as WikiPage[],
    // Toda página nasce com uma revisão de criação (RN-07).
    revisions: (SEED_PAGES as WikiPage[]).map((p) => ({
      id: uid(),
      pageId: p.id,
      userId: p.createdBy,
      userName: p.updatedByName,
      summary: 'Página criada',
      contentBefore: '',
      contentAfter: p.content,
      createdAt: p.updatedAt,
    })),
  };
  save(s);
  return s;
}
const save = (s: State) => localStorage.setItem(KEY, JSON.stringify(s));
const delay = <T>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const uid = () => crypto.randomUUID();
const me = () => userFromToken(localStorage.getItem(TOKEN_KEY));

function requireUser() {
  const u = me();
  if (!u) throw new ApiError(401, 'Você precisa entrar para fazer isso.');
  return u;
}

const isCreator = (s: State, worldId: string, userId?: string) =>
  !!userId && s.worlds.find((w) => w.id === worldId)?.creatorId === userId;

const summary = (p: WikiPage): PageSummary => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  pageType: p.pageType,
  isDraft: p.isDraft,
  updatedAt: p.updatedAt,
});

function detail(s: State, p: WikiPage): PageDetail {
  const u = me();
  const creator = isCreator(s, p.worldId, u?.id);
  return { ...p, canEdit: creator, canRestore: creator };
}

function findPage(s: State, worldId: string, slug: string): WikiPage {
  const p = s.pages.find((x) => x.worldId === worldId && x.slug === slug);
  if (!p) throw new ApiError(404, 'Página não encontrada.');
  if (p.isDraft && !isCreator(s, worldId, me()?.id)) throw new ApiError(404, 'Página não encontrada.');
  return p;
}

export const mockApi: Api = {
  async login(email, password) {
    const s = load();
    const u = s.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.password !== password) throw new ApiError(401, 'E-mail ou senha incorretos.');
    const payload = {
      [CLAIM_ID]: u.id,
      [CLAIM_EMAIL]: u.email,
      exp: Math.floor(Date.now() / 1000) + 24 * 3600,
    };
    const token = `${b64urlEncode('{"alg":"none"}')}.${b64urlEncode(JSON.stringify(payload))}.mock`;
    return delay({ token });
  },

  async register(username, email, password) {
    const s = load();
    if (s.users.some((x) => x.email.toLowerCase() === email.toLowerCase()))
      throw new ApiError(409, 'E-mail já cadastrado.');
    s.users.push({ id: uid(), username, email, password });
    save(s);
    return delay(undefined);
  },

  async listWorlds() {
    return delay(load().worlds.filter((w) => w.isPublic));
  },

  async getWorld(id) {
    const w = load().worlds.find((x) => x.id === id);
    if (!w) throw new ApiError(404, 'Mundo não encontrado.');
    return delay(w);
  },

  async createWorld(input) {
    const u = requireUser();
    const s = load();
    const w: World = {
      id: uid(),
      creatorId: u.id,
      name: input.name,
      description: input.description ?? null,
      isPublic: input.isPublic,
      createdAt: new Date().toISOString(),
    };
    s.worlds.push(w);
    save(s);
    return delay({ id: w.id });
  },

  async listPages(worldId, opts = {}) {
    const s = load();
    const creator = isCreator(s, worldId, me()?.id);
    const q = opts.q?.trim().toLowerCase();
    const list = s.pages
      .filter((p) => p.worldId === worldId && (!p.isDraft || creator))
      .filter((p) => !opts.type || p.pageType === opts.type)
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
      .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
      .map(summary);
    return delay(list);
  },

  async getPage(worldId, slug) {
    const s = load();
    return delay(detail(s, findPage(s, worldId, slug)));
  },

  async createPage(worldId, input) {
    const u = requireUser();
    const s = load();
    if (!isCreator(s, worldId, u.id)) throw new ApiError(403, 'Você não tem permissão para criar páginas.');
    const slug = slugify(input.title);
    if (!slug) throw new ApiError(400, 'Título inválido.');
    if (s.pages.some((p) => p.worldId === worldId && p.slug === slug))
      throw new ApiError(409, 'Já existe uma página com esse título.');
    const now = new Date().toISOString();
    const name = s.users.find((x) => x.id === u.id)?.username ?? u.email;
    const page: WikiPage = {
      id: uid(),
      worldId,
      campaignId: null,
      pageType: input.pageType,
      title: input.title,
      slug,
      content: input.content,
      version: 1,
      isDraft: input.isDraft,
      createdBy: u.id,
      updatedBy: u.id,
      updatedByName: name,
      updatedAt: now,
    };
    s.pages.push(page);
    s.revisions.push({
      id: uid(),
      pageId: page.id,
      userId: u.id,
      userName: name,
      summary: input.summary || 'Página criada',
      contentBefore: '',
      contentAfter: input.content,
      createdAt: now,
    });
    save(s);
    return delay(detail(s, page));
  },

  async updatePage(worldId, slug, input) {
    const u = requireUser();
    const s = load();
    const page = findPage(s, worldId, slug);
    if (!isCreator(s, worldId, u.id)) throw new ApiError(403, 'Você não tem permissão para editar esta página.');
    if (input.version !== page.version) throw new ConflictError();
    const now = new Date().toISOString();
    const name = s.users.find((x) => x.id === u.id)?.username ?? u.email;
    s.revisions.push({
      id: uid(),
      pageId: page.id,
      userId: u.id,
      userName: name,
      summary: input.summary || null,
      contentBefore: page.content,
      contentAfter: input.content,
      createdAt: now,
    });
    page.content = input.content;
    if (input.title) page.title = input.title; // o slug permanece (links não quebram)
    if (input.isDraft !== undefined) page.isDraft = input.isDraft;
    page.version += 1;
    page.updatedBy = u.id;
    page.updatedByName = name;
    page.updatedAt = now;
    save(s);
    return delay(detail(s, page));
  },

  async listRevisions(worldId, slug) {
    const s = load();
    const page = findPage(s, worldId, slug);
    const revs = s.revisions
      .filter((r) => r.pageId === page.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return delay(revs);
  },

  async restoreRevision(worldId, slug, revisionId) {
    const u = requireUser();
    const s = load();
    const page = findPage(s, worldId, slug);
    if (!isCreator(s, worldId, u.id)) throw new ApiError(403, 'Você não tem permissão para restaurar revisões.');
    const rev = s.revisions.find((r) => r.id === revisionId && r.pageId === page.id);
    if (!rev) throw new ApiError(404, 'Revisão não encontrada.');
    const now = new Date().toISOString();
    const name = s.users.find((x) => x.id === u.id)?.username ?? u.email;
    s.revisions.push({
      id: uid(),
      pageId: page.id,
      userId: u.id,
      userName: name,
      summary: `Restaurada a revisão de ${new Date(rev.createdAt).toLocaleString('pt-BR')}`,
      contentBefore: page.content,
      contentAfter: rev.contentAfter,
      createdAt: now,
    });
    page.content = rev.contentAfter;
    page.version += 1;
    page.updatedBy = u.id;
    page.updatedByName = name;
    page.updatedAt = now;
    save(s);
    return delay(detail(s, page));
  },
};
