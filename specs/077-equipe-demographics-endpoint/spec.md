# 077 — Gráficos demográficos do Equipe: endpoint agregado + paridade visual com o legado

## Contexto

Os 3 gráficos demográficos do **Relatório Equipe ABC** (Gênero, Idade, Raça/Cor) estavam **vazios em todos os
ambientes**. O `GET /reports/team` é LGPD-safe e não traz idade/gênero/raça, então a page passava dataset vazio
e a tela mostrava "Dado não disponível".

O core-api entregou o endpoint agregado (**#477**, PR #495): `GET /api/v2/reports/team/demographics`.

## O bug estrutural que motivou tudo (e que o front tinha há meses)

As 3 distribuições eram derivadas **no front**, por `countByOrder`, contra listas canônicas locais:

```ts
for (const r of rows) {
  const key = pick(r)
  if (counts.has(key)) counts.set(key, ...)   // ← chave fora da lista é IGNORADA
}
```

E as listas estavam **erradas**: gênero tinha **3 das 8** identidades; raça **não tinha `INDIGENA`**. Quem não
estava na lista **sumia** — não virava "Outros", não virava "N/A". O docblock afirmava _"soma das fatias = total
de colaboradores"_, e existia até um teste dessa invariante **que passava** — porque o placeholder só continha
valores da lista canônica. O fixture era incapaz de expor o bug.

**A gravidade não é técnica, é humana:** os grupos apagados eram justamente os minoritários (pessoas trans,
travestis, não-binárias, indígenas). Um gráfico de diversidade que apaga essas pessoas é pior que gráfico nenhum.

## O que muda

**As agregações locais foram REMOVIDAS** (`byGenero`/`byRacaCor`/`byFaixaEtaria`, `countByOrder`, `faixaIndex`
e as 3 listas canônicas). O front não mantém mais mapa `id→label`: o backend é o dono da lista e do rótulo PT.

Contrato: `{ totalActive, gender[], ageRange[], race[] }`, cada item `{ id, label, count }` — o mesmo shape que
os componentes de gráfico já consumiam. Invariante garantida com teste no backend: **soma == `totalActive`**;
valor desconhecido cai no balde `OUTROS` e **continua somando**.

## Cadeia (BFF · DDD → MVVM) — espelha `/reports/team`

`reports.io` (`CategoryCount`/`TeamDemographics`) → schema Zod → mapper `teamDemographicsToModel` → client HTTP
`getTeamDemographics` → use-case `createGetTeamDemographics` → composição → server-fn
`get-team-demographics.query.fn` → repository (porta + wire) → `teamDemographicsQueryOptions` →
`useEquipeDemographics` → page.

### Query SEPARADA da tabela — de propósito

São endpoints distintos e o sensível pode falhar sozinho (RBAC próprio). Se a demografia der 403, **a tabela
continua carregando** e só os 3 gráficos ficam vazios. Amarrar os dois faria um erro de dado sensível derrubar
o relatório inteiro — e foi exatamente o que aconteceu na validação (ver abaixo).

### O mapper passa DIRETO

Não filtra, não reordena, não "corrige". Qualquer esperteza ali reintroduziria o bug pela porta dos fundos.
Testes de **passagem íntegra** cobrem isso.

## Paridade visual com o legado (P.O., em tela)

| #   | Correção                                             | Causa                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Cores por `id` canônico**, não por índice          | 🐛 introduzido nesta feature: as cores eram aplicadas por índice 0..5 casando com a `RACA_ORDER` antiga; com 7 categorias em outra ordem, cada cor foi para a categoria errada (Pardo com o marrom do Preto). `INDIGENA` ganhou cor — antes nem existia. |
| 2   | **Donut → PIZZA** com rótulos dentro das fatias      | paridade com o legado. Truque: o mesmo `<circle>` + `stroke-dasharray`, com `R=30`/`STROKE=60` fechando o furo — sem `path`/bezier.                                                                                                                      |
| 3   | **Categorias zeradas ocultas**                       | a legenda de gênero tinha 9 linhas com 8 zeros e esticava a altura dos 3 cards (grade `stretch`). O legado só desenha quem tem gente.                                                                                                                    |
| 4   | **Gráficos preenchem o card**                        | `justifyContent: center` + linhas de altura fixa deixavam vazio enorme.                                                                                                                                                                                  |
| 5   | **Eixo Y "redondo" no gráfico de Ano**               | 🐛 o teto era o máximo cru: com máximo 1 e 3 divisões os rótulos saíam `0 · 0 · 1 · 1`. Agora passo 1/2/5/10 × potência de 10, como o legado (`0 · 6 · 12 · 18 · 24`).                                                                                   |
| 6   | **Coluna do rótulo estreita** nas barras horizontais | 180px fixos (herdados de gráfico full-width) comiam metade do card e empurravam as barras para a direita.                                                                                                                                                |
| 7   | **Função em azul escuro**, Idade em ciano            | no legado ambos são ciano, mas lá **não ficam lado a lado**; aqui ficam, e duas cores iguais parecem o mesmo gráfico repetido.                                                                                                                           |

### ⚠️ Armadilha registrada: porcentagem exige altura definida

Ao trocar a altura fixa do `vbars` por `flex: 1`, **todas as barras de Raça/Cor sumiram** — a altura do
`vbarFill` é uma **porcentagem**, e porcentagem só resolve contra pai de altura **definida**. Ficou
`blockSize: 100%` + `minBlockSize`, com o porquê comentado no código.

## Achado de ambiente (não é código)

Na validação, os gráficos vinham vazios com **403**: o endpoint nasceu sob `collaborator:read-sensitive`, uma
permissão **nova que ninguém tinha**. O job `auth:sync-permissions` (#462) não resolveu porque **só sincroniza o
papel `admin-sistema`**, e o usuário real está em papel próprio do seed → issue **#496**.

Resolvido no backend (`b4661285`): o gate passou a ser `collaborator:read` — o mesmo da tabela. O argumento:
_"o `/reports/team` expõe raça/gênero POR PESSOA, com nome, sob `read`; trancar o agregado — que não identifica
ninguém — atrás de permissão MAIS restritiva não protegia nada"_. A segregação volta no redesenho do RBAC,
aplicada aos **dois** endpoints juntos (**#497**).

## Fora de escopo

- **As 3 colunas demográficas da TABELA** (Idade, Identidade de gênero, Raça/cor) seguem mostrando `—`: o
  `/reports/team` não manda os campos. Decisão pendente do cliente — o CSV de export inclui as colunas, e
  removê-las pode quebrar prestação de contas a financiador. Tabela e CSV têm que andar juntos.
- **k-anonimato**: removido por decisão da P.O. (2026-07-20) — a régua é replicar o legado, que não suprimia.

## Gate / DoD

- `pnpm verify` exit 0 · node:test **1567 pass / 0 fail** · Vitest **570 pass / 0 fail** · lint 0 erros.
  ⚠️ `pnpm verify` **não roda o `test:dom`** — rodado à parte.
- Cobertura nova (mapper): passagem íntegra · **não descarta** `TRAVESTI`/`INDIGENA`/`OUTROS` · preserva
  `count: 0` · preserva a ordem do backend · invariante da soma · drift → `err('server')`.
- **Sabotagem verificada:** reintroduzir o filtro de `INDIGENA` no mapper faz **dois** testes falharem (o de
  não-descarte e o da invariante).
- Testes mortos removidos: os `describe` das 3 agregações e a asserção da invariante que **passava por
  fixture pobre**.
- **Validado em tela** (local, com a P.O.): gráficos populam, cores por categoria corretas, layout preenchendo
  o card, eixo do Ano com rótulos distintos.
