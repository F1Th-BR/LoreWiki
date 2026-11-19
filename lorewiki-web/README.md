# LoreWiki Web

Frontend do LoreWiki: React + Vite + TypeScript. Layout de wiki inspirado em MediaWiki/wiki.gg (barra lateral, abas **Ler / Editar / Histórico**, infobox, sumário) com tema escuro (padrão) e claro (azul do antigo front estático).

## Rodando

```bash
cd lorewiki-web
npm install
npm run dev        # http://localhost:5173
```

Por padrão roda em **modo demonstração** (`VITE_API_MODE=mock`): tudo fica no `localStorage` do navegador, com o mundo *Sombras Ocultas* de exemplo. Login de teste: `demo@lorewiki.dev` / `demo1234` (criador do mundo).

### Usando a API .NET de verdade

```bash
cp .env.example .env      # e troque para VITE_API_MODE=real
# em outro terminal: cd ../lorewiki-api && dotnet run   (porta 5191)
npm run dev
```

No modo `real`, login, cadastro, listar e criar mundos já funcionam. Páginas, revisões e busca dependem de endpoints que a API ainda não tem: veja [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

## O que já está implementado

| Requisito | Onde |
| --- | --- |
| RF-01/02 cadastro e login | `pages/AuthPages.tsx` (OAuth Google ainda não) |
| RF-07 tipos de página | `api/types.ts`, seletor no editor |
| RF-08 editor com preview em tempo real | `pages/PageEdit.tsx` |
| RF-10 links internos `[[Página]]` (links para páginas inexistentes ficam vermelhos) | `lib/markdown.ts` |
| RF-11 rascunho / publicada | editor + selo "rascunho" |
| RF-15–19 histórico, diff entre duas revisões, restaurar, último editor | `pages/PageHistory.tsx`, `components/DiffView.tsx` |
| RF-20–22 busca com autocomplete, busca por conteúdo, filtro por tipo | `components/SearchBox.tsx`, `pages/SearchPage.tsx` |
| RF-23/24 índice por tipo e modificadas recentemente | `pages/WorldHome.tsx`, `pages/WorldIndex.tsx` |
| RF-25/26/29 criar mundos (público/privado) | `pages/NewWorld.tsx` |
| RN-11 conflito de edição (409) mostra o diff, sem descartar nada | `pages/PageEdit.tsx` |
| RNF-06 responsivo | `styles.css` |

**Ainda não feito** (depende da API): campanhas e papéis de Mestre/Jogador, vínculos jogador-personagem (UC-03), upload de imagens e galeria (RF-12–14; o infobox aceita uma URL de imagem por enquanto), recuperação de senha, OAuth, tags (RF-09).

## Estrutura

```
src/
  api/         tipos, cliente HTTP, real.ts (API .NET), mock.ts + seed.ts (modo demo)
  auth/        contexto de login (JWT no localStorage) e leitura do token
  components/  layout do mundo, abas, infobox, sumário, busca, diff
  lib/         markdown (frontmatter + [[links]] + sanitização), slug
  pages/       telas
```

## Segurança

O Markdown é convertido com `marked` e **sanitizado com DOMPurify** antes de ir para a tela (XSS). O token JWT fica no `localStorage` (simples, mas exposto a XSS); quando a API estiver madura, considere cookie `HttpOnly`.
