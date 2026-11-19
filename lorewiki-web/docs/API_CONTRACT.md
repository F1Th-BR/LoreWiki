# Contrato da API esperado pelo frontend

O frontend (`src/api/real.ts`) já chama estes endpoints. Os dois primeiros blocos **já existem** na API; o restante é a **proposta** que o frontend assume. Se você preferir outros caminhos/nomes, basta ajustar `real.ts` (é o único arquivo que conhece as rotas).

JSON em camelCase (padrão do ASP.NET). Autenticação: `Authorization: Bearer <jwt>`.

## Já existem

| Método | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ username, email, password }` | 201 / 409 (e-mail em uso) |
| POST | `/auth/login` | `{ email, password }` | 200 `{ token, expiraEm }` / 401 |
| GET | `/worlds` | – | `World[]` (só públicos) |
| POST | `/worlds` | `{ name, description?, isPublic }` | 201 `{ id, mensagem }` 🔒 |

## Proposta (ainda não existem)

| Método | Rota | Observações |
| --- | --- | --- |
| GET | `/worlds/{id}` | `World`. Público, ou privado se o usuário tiver papel no mundo. |
| GET | `/worlds/{id}/pages?type=&q=` | `PageSummary[]` = `{ id, title, slug, pageType, isDraft, updatedAt }`. `q` busca em título e conteúdo (RF-20/21). Rascunhos só para quem pode editar (RN-09). |
| GET | `/worlds/{id}/pages/{slug}` | `PageDetail` = campos de `WikiPage` + `updatedByName` + `canEdit` + `canRestore`. O frontend usa `canEdit`/`canRestore` só para mostrar/esconder botões; **a API continua sendo quem autoriza** (`RbacService.UserCanEdit`). |
| POST | `/worlds/{id}/pages` | `{ title, pageType, content, isDraft, summary? }` → `PageDetail`. Gera o `slug`, cria a revisão inicial. 409 se o slug já existe. |
| PUT | `/worlds/{id}/pages/{slug}` | `{ content, isDraft?, summary?, version }` → `PageDetail`. Se `version` ≠ versão atual, responda **409** (RN-11). Incrementa `version` e grava revisão. |
| GET | `/worlds/{id}/pages/{slug}/revisions` | `Revision[]` = `{ id, pageId, userId, userName, summary, contentBefore, contentAfter, createdAt }`, da mais nova para a mais antiga. |
| POST | `/worlds/{id}/pages/{slug}/revisions/{revisionId}/restore` | Cria **nova** revisão com o `contentAfter` da revisão escolhida → `PageDetail`. Só criador/mestre (RF-18). |

## Convenções de conteúdo

O `content` da página é Markdown com um **frontmatter opcional** que alimenta o infobox. Nada muda no banco:

```
---
image: https://…/retrato.png
caption: Legenda
accent: #d4af37
Espécie: Humana
Facção: [[Vanguarda]]
---
Texto em **Markdown**. Links internos: [[Título]] ou [[Título|texto]].
```

- `image`, `caption`, `accent` são reservados; qualquer outra chave vira uma linha do infobox.
- `[[Título]]` aponta para a página cujo slug é `slugify(Título)` (minúsculas, sem acento, `-`). O frontend e a API precisam gerar o slug **da mesma forma** (veja `src/lib/slug.ts`).

## CORS

Em desenvolvimento o Vite faz proxy de `/api/*` para a API, então **não precisa de CORS**. Em produção, ou sirva o frontend pelo mesmo domínio (reverse proxy) ou adicione `builder.Services.AddCors(...)` + `app.UseCors()` na API antes de `UseAuthentication()`.
