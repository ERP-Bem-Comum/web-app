# 123 — Filtro de Geração no relatório Equipe Bem Comum

**Tamanho:** M · **Status:** backend entregue (core-api#1055 via PR #1066, na `dev` em 16/10); validação da P.O. na homologação · **Data:** 2026-10-12
**Depende de:** `core-api#1055` (o `GET /reports/team` expor `generation` por pessoa)
**Origem:** pedido da P.O. — filtrar o relatório **Equipe Bem Comum** por geração (Boomer, X, Millennial, Z),
derivada da data de nascimento, no mesmo padrão dos filtros de hoje.

## Problema

O `/reports/team` entrega por pessoa só a **idade** (anos completos). A `dateOfBirth` é barrada na fronteira
por LGPD. Geração é por **ano** de nascimento, e uma idade cobre dois anos. Com referência em 12/10/2026:

| Fronteira                  | Idade ambígua | Pode ser     |
| -------------------------- | ------------- | ------------ |
| Boomer → X (1964/1965)     | 61            | 1964 ou 1965 |
| X → Millennial (1980/1981) | 45            | 1980 ou 1981 |
| Millennial → Z (1996/1997) | 29            | 1996 ou 1997 |

Calcular a geração no front a partir da idade classificaria errado parte de quem tem essas idades.

## Regra (decisões da P.O., 12/10)

- **Opção B:** o core-api deriva a geração no `partners`, ao lado da idade, e manda só o **código**. Nem a
  data nem o ano atravessam. O front **não** deriva da idade.
- **Recortes (Pew Research), por ano de nascimento:**

| Código       | Rótulo                 | Nascidos em            |
| ------------ | ---------------------- | ---------------------- |
| `BOOMER`     | Baby Boomer            | 1946–1964              |
| `GEN_X`      | Geração X              | 1965–1980              |
| `MILLENNIAL` | Millennial (Geração Y) | 1981–1996              |
| `GEN_Z`      | Geração Z              | 1997–2012              |
| `NA`         | N/A                    | sem data de nascimento |

- **Só o filtro:** sem gráfico e sem coluna nova (tabela, modal e CSV ficam como estão).
- **Fora dos recortes** (até 1945 / a partir de 2013): proposto `OUTROS` na #1055 ("Outras gerações"). O
  front não fixa a lista: código desconhecido entra nas opções (antes do N/A) quando alguém o tem.

## Escopo (front)

| #   | Entrega                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | BFF: `generation` no schema de borda (`z.string().min(1).catch('NA')`), no `TeamMember` do server e no mapper                                  |
| 2   | Client: `generation` no model; `geracao` na linha (`toTeamRows`)                                                                               |
| 3   | ViewModel: `GENERATIONS` (ordem cronológica) + `NA`; `teamFilterOptions().geracao`; `TeamFilters.geracao`; `applyTeamFilters` compara o código |
| 4   | Tela: seletor **Geração** ao lado de Idade, com "Todos"; entra no resumo de filtros aplicados                                                  |
| 5   | i18n: `reports.equipe.filters.geracao` + `reports.equipe.generation.*`                                                                         |

**Compatibilidade:** core-api sem a #1055 → a chave falta → todo mundo cai em `NA`. A tela não quebra, mas
o filtro só é útil depois que a #1055 entrar na `dev`. Por isso o PR fica em **rascunho** até lá.

**LGPD:** a allowlist de chaves da linha (`equipe.view-model.test.ts`) ganhou `geracao`, por decisão
consciente: é um balde mais grosso que a `idade`, que já está lá.

## Testes

- `reports-mappers.test.ts`: o código passa; ausente ou vazio → `NA` (core-api antigo não derruba o relatório).
- `reports-adapters.test.ts`: `toTeamRows` leva a geração para a linha.
- `equipe.view-model.test.ts`: filtro por geração (inclusive duas pessoas de 29 anos em gerações
  diferentes); opções em ordem com `NA` no fim; `OUTROS` aparece quando há alguém.
- `equipe.page.spec.tsx`: seletor com as 4 gerações + N/A; filtrar recorta a tabela e entra no resumo.

## Validação (P.O.)

Só tem geração quem tem data de nascimento, ou seja, quem completou o cadastro (Autocadastro). No local, o
seed não preenche demografia: completar um colaborador antes de validar. Com a #1055 na `dev`, filtrar por
cada geração e conferir pela data de nascimento cadastrada.
