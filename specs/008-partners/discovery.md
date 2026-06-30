# Descoberta: Gestão de Parceiros (épico `partners`)

**Feature**: `specs/008-partners/` · **Consultor**: `/acdg-skills:requirements-engineer`

> Fase 0 (frontend). Elicitação a partir da engenharia reversa do legado (ERP Financeiro) e do contexto
> do produto. Saída alimenta a `spec.md`. Fonte de dados = `core-api` via server function; o front clona
> comportamento e nunca acessa o backend direto.

## Problema / Oportunidade

A organização precisa gerir seus parceiros — pessoas (colaboradores), prestadores (fornecedores),
financiadores e a abrangência territorial (estados/municípios) — hoje no legado (Next/MUI). A migração
para a v2 (TanStack Start) deve **clonar fielmente** essas telas para que o usuário não perceba a troca
de tecnologia, ganhando arquitetura sustentável (BFF, MVVM, errors-as-values, design system) e saneando
bugs de borda do legado.

## Stakeholders

| Stakeholder | Interesse / o que espera | Decisor? |
|---|---|---|
| P.O. | Paridade funcional com o legado; entrega progressiva | sim |
| Gestores/ABC | CRUD de pessoas/fornecedores ágil; pré-cadastro; filtros | não |
| Arquitetura Frontend v2 | Aderência à constituição (I–XII) e ADRs; módulo extraível | sim |
| Time core-api | Receber gaps de API priorizados | não (consumidor) |

## Histórias de usuário (INVEST)

- **US-001** (P1): Colaboradores — CRUD + pré-cadastro 2 etapas + filtros + import + desativar c/ motivo.
  - **Valor**: CRUD central de pessoas, maior uso diário.
  - **Critérios**: ver `spec.md` US1.
- **US-002** (P1): Fornecedores — CRUD com bancário/PIX, filtros por categoria, exportar.
  - **Valor**: dados financeiros herdados por Contratos.
- **US-003** (P2): Financiadores — CRUD simples.
- **US-004** (P2): Estados parceiros — dual-panel, persistência imediata.
- **US-005** (P3): Municípios parceiros — dual-panel + filtro UF, cross-state.

## Requisitos

### Funcionais
Ver `spec.md` (FR-001 … FR-018). Resumo: listar/filtrar/paginar; CRUD por tipo; pré-cadastro e
promoção de situação; import/export; dual-panel territorial; saneamento de bugs de borda; fallback/mock.

### Não-funcionais (viram métricas)
- **RNF-001** (Performance): listagem p95 < 1s no volume de teste.
- **RNF-002** (Segurança): token nunca no browser; rotas protegidas (401 → login).
- **RNF-003** (i18n): toda string de UI via catálogo.
- **RNF-004** (Design system): só-tokens; hierarquia Atomic.
- **RNF-005** (Acessibilidade): navegável por teclado; modais com foco/aria.
- **RNF-006** (Evolutibilidade): troca mock→API real sem tocar UI/ViewModel.

## Restrições e premissas (frontend)

- Stack: TanStack Start + React 19 + Zod 4 + vanilla-extract; pnpm; TS estrito (ADR-0003/0007/0009).
- BFF é a única fronteira; dados do `core-api` em `/api/v1` (ver `api-readiness-report.md`).
- Módulo `partners` espelha `contracts`/`auth` (split client×server, ADR-0004; agnóstico, ADR-0009).

## Fora de escopo

Ver `spec.md` (Out of Scope): alterar o core-api, CRUD de usuários, telas de Contratos, dashboards.

## Fonte de evidência (engenharia reversa)

- `handbook/specs-desing-system/gestão de parceiros/` — `context.md` (propósito/rotas), `dom.md`
  (DOM com refs/valores), `screenshots.md` (estados) por sub-domínio + `evidencias_soltas/` (AppShell,
  dashboard, tokens). Clone fiel: replicar comportamento, sanear bugs de borda (encoding, breadcrumb).

## Perguntas em aberto

- [ ] [NEEDS CLARIFICATION: catálogo canônico de categorias de Fornecedor — 22 (evidência) vs ~39/40 (core-api)?] → FR-017.
- [ ] [NEEDS CLARIFICATION: Financiador PF além de PJ? core-api é PJ-only] → FR-018.
- [ ] [NEEDS CLARIFICATION: filtros de "programa" e "idade" em Colaboradores não existem no core-api — manter na UI como client-side ou remover?]
- [ ] [NEEDS CLARIFICATION: Estados/Municípios — persistência definitiva depende da decisão D9 do ADR-0031 do core-api (hard vs soft). Mock até lá.]
