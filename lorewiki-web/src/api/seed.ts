import type { PageType } from './types';
import { slugify } from '../lib/slug';

// Dados de exemplo baseados no antigo front estático do "Sombras Ocultas" (mundo Brasilis).
// Só serve para o modo mock; no modo real tudo vem do PostgreSQL.

export const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'FTH',
  email: 'demo@lorewiki.dev',
  password: 'demo1234',
};
export const DEMO_WORLD_ID = '00000000-0000-4000-8000-0000000000a1';

interface SeedPage {
  title: string;
  pageType: PageType;
  content: string;
}

const pages: SeedPage[] = [
  {
    title: 'Breve história de Brasilis',
    pageType: 'main_story',
    content: `---
accent: #1f3fa8
---
Brasilis é um mundo com aproximadamente 2.400 anos de existência, dividido em dois grandes continentes: **Verapasc**, ao norte, e **Sancruz**, ao sul. Sua história é marcada por duas grandes eras.

## Eras

A **1ª Era (0 - 2000)** se estendeu desde a criação do mundo até a queda de Umbra Arctis, um império forjado pelo terror, derrotado no ano 2000 pela [[Vanguarda]], que surgiu como resposta à expansão de Arctis.

A **2ª Era**, também chamada de *Era Atual*, começou no ano 2000 (marcado como o Ano 0 da nova contagem) e se estende até os dias de hoje, 400 2E.

## A ameaça das sombras

Há cerca de 50 anos, uma nova ameaça emergiu das sombras. Uma organização criminosa, muitas vezes chamada de herdeira de Umbra Arctis, revelou sua influência: a [[Ordem das Sombras]]. Seu ato mais impactante ocorreu durante a última guerra civil de [[Reino de Delcor|Delcor]], um reino crucial para o comércio global por ser o maior exportador de armas e armaduras.

A Ordem não agiu diretamente. Em vez disso, fortaleceu uma facção criminosa local, utilizando-a como marionete: os [[Lobos do Deserto]].

O resultado? Delcor enfrentou sua quarta grande crise, entre golpes de Estado e guerras civis, em apenas 40 anos. O conflito, a [[Insurreição de Fevereiro]], se estendeu de 393 2E a 398 2E.

## Introdução

Em um mundo chamado Brasilis, quatro indivíduos de origens distintas foram convocados por [[Wilhelm Albretch]], um paladino meio-elfo, para dar início a uma nova fase em suas vidas. Agora, como aventureiros, terão a chance de explorar o desconhecido, aprimorar suas habilidades e enfrentar missões comuns ou extraordinárias.
`,
  },
  {
    title: 'Vanguarda',
    pageType: 'faction',
    content: `---
image: https://placehold.co/400x400/1b1b1b/d4af37?text=Vanguarda
caption: Brasão da Vanguarda
accent: #d4af37
Fundação: 1000 1E
Origem: Aliança entre [[GrandeWald]] e [[Reino de Delcor|Delcor]]
Sede: Variável
Inimigo principal: [[Ordem das Sombras]]
---
A Vanguarda surgiu como uma aliança entre os reinos de [[GrandeWald]] e [[Reino de Delcor|Delcor]], criada em 1000 1E para conter o expansionismo e a brutalidade do império Umbra Arctis. Seu objetivo inicial era deter o avanço de Arctis e, posteriormente, libertar os territórios ocupados.

Com a queda de Umbra Arctis, a Vanguarda assumiu um papel de mediação de conflitos entre nações e passou a monitorar possíveis ameaças internacionais. Atualmente, sua principal luta é contra a [[Ordem das Sombras]], liderada pelo enigmático **Rei do Crime**.

## Vertentes da Vanguarda

A Vanguarda opera por meio de duas vertentes, que atuam de forma independente, mas colaboram quando necessário:

- **Vertente Política**: responsável por intermediar crises diplomáticas e resolver conflitos de interesse entre nações. É composta majoritariamente por sacerdotes, clérigos, magos e estudiosos.
- **Vertente Militar**: responsável por combater organizações criminosas, intervir em conflitos armados e auxiliar populações afetadas por calamidades.

Quando ambas as vertentes se unem, a situação é crítica. Um exemplo disso foi a [[Insurreição de Fevereiro]], quando os políticos estavam em Delcor discutindo os investimentos anormais da [[Ordem das Sombras]] nos [[Lobos do Deserto]].

## Hierarquia Militar

### Alto Comando

Página em construção.
`,
  },
  {
    title: 'Ordem das Sombras',
    pageType: 'faction',
    content: `---
image: https://placehold.co/400x400/151515/ffffff?text=Ordem+das+Sombras
accent: #8b1a1a
Tipo: Organização criminosa
Líder: Rei do Crime
Inimigo principal: [[Vanguarda]]
---
Organização criminosa frequentemente chamada de herdeira de Umbra Arctis. Por onde passou, deixou um rastro de morte e destruição.

É a maior exportadora de armas e armaduras do comércio global e usa os [[Lobos do Deserto]] como marionete em [[Reino de Delcor|Delcor]].
`,
  },
  {
    title: 'Lobos do Deserto',
    pageType: 'faction',
    content: `---
image: https://placehold.co/400x400/3d3d3d/a67c00?text=Lobos+do+Deserto
accent: #a67c00
Tipo: Facção criminosa local
Sede: [[Reino de Delcor|Delcor]]
Patrocinador: [[Ordem das Sombras]]
---
Facção criminosa de Delcor fortalecida pela [[Ordem das Sombras]], que a utilizou como marionete durante a [[Insurreição de Fevereiro]].
`,
  },
  {
    title: 'Reino da Cisplatina',
    pageType: 'location',
    content: `---
Localização: Ilha de Cisplatina, leste de Verapasc
Governo: Monarquia absolutista
População: Humanos, anões, elfos e meio-elfos
---
Localizado na Ilha de Cisplatina, ao leste de Verapasc, é conhecido por ter as melhores escolas e universidades dentre os continentes, com grande parte dos magos, feiticeiros e paladinos renomados tendo sua educação feita nesse reino.

Conhecido também pela pontualidade e integridade de seu povo que, em geral, ingressam no exército, no conselho acadêmico ou se tornam aventureiros.

Seu sistema de governo é uma monarquia absolutista.
`,
  },
  {
    title: 'Reino de Delcor',
    pageType: 'location',
    content: `---
Localização: Centro-sul de Verapasc
Governo: Monarquia parlamentarista (eleições a cada 6 anos)
População: Majoritariamente humanos
---
Localizado na região centro-sul do continente de Verapasc, é conhecido por ser um reino instável: sofreu 4 golpes de estado e mudança no regime de governo em um período de 40 anos. Possui uma cultura parecida com o reino de [[GrandeWald]], entretanto possui vários problemas políticos além da corrupção.

Tais problemas acabaram levando à separação da província de Ipiran do Estado principal, gerando **NovaDelcor**.

Foi palco da [[Insurreição de Fevereiro]].
`,
  },
  {
    title: 'Reino de DonKice',
    pageType: 'location',
    content: `---
Localização: Nordeste de Verapasc
Clima: Muito frio
População: Anões, draconatos, meio-orcs, humanos e alguns elfos
---
Localizado na região nordeste de Verapasc, é conhecido por sua baixíssima temperatura e alto consumo de álcool e uma comida peculiar para esse mundo, conhecida em DonKice como churrasco.

> "Se seu dia está ruim, mas você tem companheiros, uma carne de cordeiro bem preparada e um tonel de hidromel, seu dia está perfeito!" — ditado popular

Apesar de ser muito gelado, os corações desse povo são calorosos: costumam se reunir em tavernas, nas casas de amigos e familiares e estão dispostos a embarcar em uma boa aventura.
`,
  },
  {
    title: 'GrandeWald',
    pageType: 'location',
    content: `Reino aliado de [[Reino de Delcor|Delcor]] na fundação da [[Vanguarda]].

Página em construção.
`,
  },
  {
    title: 'Insurreição de Fevereiro',
    pageType: 'event',
    content: `---
Período: 393 2E a 398 2E
Local: [[Reino de Delcor|Delcor]]
Tipo: Guerra civil
---
Guerra civil que assolou [[Reino de Delcor|Delcor]] de 393 a 398 2E, fomentada pelos investimentos da [[Ordem das Sombras]] nos [[Lobos do Deserto]]. O Exército da [[Vanguarda]] foi enviado para auxiliar Delcor.
`,
  },
  {
    title: 'Wilhelm Albretch',
    pageType: 'npc',
    content: `---
Espécie: Meio-elfo
Classe: Paladino
Estado: Vivo
Tipo: PdM
---
Paladino meio-elfo da [[Vanguarda]] que convocou quatro indivíduos de origens distintas para dar início à campanha. Mestre de [[Rosemary Watson Baldwin|Rosemary]].
`,
  },
  {
    title: 'Rosemary Watson Baldwin',
    pageType: 'npc',
    content: `---
image: https://placehold.co/400x500/2f5d3a/ffffff?text=Rosemary
accent: #b11212
Espécie: Humana
Sexo: Feminino
Idade: 22
Altura: 1.65m
Classe: Ladino
Estado: Viva
Tipo: PdM
---
> "Por que demoraram tanto?" — Rosemary para Ak'thul e Saulo, após alcançarem-na para pegar a 1ª missão, sessão 1.

## Descrição

Rosemary Watson Baldwin, conhecida simplesmente como Rosemary, é uma agente da [[Vanguarda]] e aprendiz de [[Wilhelm Albretch]]. Foi responsável por entregar a missão de investigar uma dungeon misteriosa em **NovaDelcor** a [[Ak'thul]] e [[Saulo Samelost]].

Após encontrarem informações suspeitas na dungeon e serem teletransportados repentinamente para [[Reino de Delcor|Delcor]], Saulo começou a desconfiar de que Rosemary poderia ter algum envolvimento com a [[Ordem das Sombras]]. Suas suspeitas foram parcialmente confirmadas por Wilhelm, que revelou que ela esteve envolvida na [[Insurreição de Fevereiro]].

## Aparência

Rosemary é uma humana jovem, com 1,65 metro de altura, cabelos brancos, longos e lisos e olhos âmbar. Costuma vestir uma blusa branca de mangas longas, sobre a qual usa uma armadura de couro batido, luvas de couro marrons, uma capa branca com capuz, calça cinza e botas de couro marrons de cano alto.

## Passado

Durante a [[Insurreição de Fevereiro]], Rosemary atuou como espiã e assassina a serviço da [[Ordem das Sombras]]. Atualmente, é membro da [[Vanguarda]].
`,
  },
  {
    title: "Ak'thul",
    pageType: 'character',
    content: `---
Estado: Vivo
Tipo: PJ
---
Aventureiro convocado por [[Wilhelm Albretch]]. Página em construção.
`,
  },
  {
    title: 'Saulo Samelost',
    pageType: 'character',
    content: `---
Estado: Vivo
Tipo: PJ
---
Aventureiro convocado por [[Wilhelm Albretch]]. Desconfia de [[Rosemary Watson Baldwin|Rosemary]]. Página em construção.
`,
  },
  {
    title: 'Kaiser Lex Oregon',
    pageType: 'character',
    content: `---
Estado: Vivo
Tipo: PJ
---
Página em construção.
`,
  },
];

export const SEED_WORLD = {
  id: DEMO_WORLD_ID,
  creatorId: DEMO_USER.id,
  name: 'Sombras Ocultas',
  description:
    'Explore os personagens, organizações e a história de Brasilis, o mundo dessa campanha de RPG.',
  isPublic: true,
  createdAt: '2025-05-01T12:00:00Z',
};

export const SEED_PAGES = pages.map((p, i) => ({
  id: `00000000-0000-4000-8000-${String(i + 100).padStart(12, '0')}`,
  worldId: DEMO_WORLD_ID,
  campaignId: null,
  pageType: p.pageType,
  title: p.title,
  slug: slugify(p.title),
  content: p.content,
  version: 1,
  isDraft: false,
  createdBy: DEMO_USER.id,
  updatedBy: DEMO_USER.id,
  updatedByName: DEMO_USER.username,
  updatedAt: new Date(Date.UTC(2025, 4, 1 + i, 12)).toISOString(),
}));
