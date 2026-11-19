// Tipos espelhando os modelos da API (.NET serializa em camelCase).

export type PageType =
  | 'character'
  | 'npc'
  | 'location'
  | 'event'
  | 'item'
  | 'faction'
  | 'main_story'
  | 'other';

export const PAGE_TYPES: { value: PageType; label: string; plural: string }[] = [
  { value: 'character', label: 'Personagem', plural: 'Personagens' },
  { value: 'npc', label: 'NPC', plural: 'NPCs' },
  { value: 'location', label: 'Localidade', plural: 'Localidades' },
  { value: 'event', label: 'Evento', plural: 'Eventos' },
  { value: 'item', label: 'Item', plural: 'Itens' },
  { value: 'faction', label: 'Facção / Guilda', plural: 'Facções e Guildas' },
  { value: 'main_story', label: 'História Principal', plural: 'História Principal' },
  { value: 'other', label: 'Outros', plural: 'Outros' },
];

export const pageTypeLabel = (t: string) => PAGE_TYPES.find((p) => p.value === t)?.label ?? t;
export const pageTypePlural = (t: string) => PAGE_TYPES.find((p) => p.value === t)?.plural ?? t;

export interface World {
  id: string;
  creatorId: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface PageSummary {
  id: string;
  title: string;
  slug: string;
  pageType: PageType;
  isDraft: boolean;
  updatedAt: string;
}

export interface WikiPage extends PageSummary {
  worldId: string;
  campaignId?: string | null;
  content: string;
  version: number;
  createdBy: string;
  updatedBy: string;
  updatedByName?: string | null; // RF-19: nome do último editor
}

/** A API devolve, junto da página, o que o usuário logado pode fazer nela (RBAC). */
export interface PageDetail extends WikiPage {
  canEdit: boolean;
  canRestore: boolean;
}

export interface Revision {
  id: string;
  pageId: string;
  userId: string;
  userName?: string | null;
  summary?: string | null;
  contentBefore: string;
  contentAfter: string;
  createdAt: string;
}

export interface CreateWorldInput {
  name: string;
  description?: string;
  isPublic: boolean;
}

export interface CreatePageInput {
  title: string;
  pageType: PageType;
  content: string;
  isDraft: boolean;
  summary?: string;
}

export interface UpdatePageInput {
  title?: string;
  content: string;
  isDraft?: boolean;
  summary?: string;
  /** Versão que o editor viu ao abrir a página; se mudou, a API responde 409 (RN-11). */
  version: number;
}

export interface Api {
  login(email: string, password: string): Promise<{ token: string }>;
  register(username: string, email: string, password: string): Promise<void>;

  listWorlds(): Promise<World[]>;
  getWorld(id: string): Promise<World>;
  createWorld(input: CreateWorldInput): Promise<{ id: string }>;

  listPages(worldId: string, opts?: { type?: PageType; q?: string }): Promise<PageSummary[]>;
  getPage(worldId: string, slug: string): Promise<PageDetail>;
  createPage(worldId: string, input: CreatePageInput): Promise<PageDetail>;
  updatePage(worldId: string, slug: string, input: UpdatePageInput): Promise<PageDetail>;
  listRevisions(worldId: string, slug: string): Promise<Revision[]>;
  restoreRevision(worldId: string, slug: string, revisionId: string): Promise<PageDetail>;
}
