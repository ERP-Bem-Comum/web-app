# Spec — Lista de Planejamento ligada ao core-api real (de-interim) · #055

- **Feature:** `055-budget-plans-list-de-interim`
- **Escala:** L (troca de fonte placeholder→real + adaptação de modelo id/version + inversão de dependência)
- **Rastreio:** core-api#315 (Fatia 1 CRUD) · #316 (árvore de custos) · #113 (épico) · HANDBOOK Plano Orçamentário §1
- **Origem do dado:** REAL (`GET /api/v2/budget-plans`, core-api `go-live`) — sai do placeholder front-first

## Contexto

A tela **Planejamento** (`/planejamento`) renderizava **dados fictícios** (placeholder). Com a Fatia 1 (#315)
e a árvore de custos (#316) na `go-live` do core-api e a migração legado→novo concluída, a lista passa a ler
**dado real migrado**. O modelo NOVO do core-api é intencionalmente diferente do legado (correção de erros):
`id` UUID, `version {major,minor}`, rede como união discriminada. O front **adapta-se** a esses formatos e
compõe no BFF o que a Fatia 1 não projeta; o que falta de negócio vira handoff ao backend.

## User Story (P1)

> Como analista de planejamento, quero ver a lista real de planos orçamentários (migrados do legado), com
> nome, ano, status, total, atualização e parceiros/rede, para trabalhar sobre dado verdadeiro — sem fictício.

## Requisitos funcionais

- **FR-001** — O BFF expõe `listBudgetPlansFn` (§III, única fronteira): auth no handler, Zod na borda (§IX),
  `Result` (§V). Compõe `GET /budget-plans` (lista) + `/options` (abreviação por `programRef`) + `/:id`
  (budgets → `partnersCount`/`networkKind`, **INTERINO B1** até core-api#372).
- **FR-002** — Inversão de dependência (§ server): o PORT `BudgetPlansCoreClient` e seus tipos crus vivem na
  _application_; o adapter os implementa e mapeia o DTO do core (anti-corrupção Zod). `domain ← application ← adapters`.
- **FR-003** — Adaptação de modelo no client (fiel ao legado, sem inventar campo): `id: number → string` (UUID);
  `version "1.0" → 1.0` (parse no BFF, sem churn de view-model); `updatedByName` nullable (data-only até #373);
  `scenarioName`/árvore de versões = flat (feature pendente #317/#318, sem fabricar).
- **FR-004** — Binding lê via `useQuery` + `budgetPlansRepository`, mantendo **filtro/busca/paginação
  client-side** (fetch único `limit=100`) → **zero regressão de UX**. `programOptions`/total geral derivam do
  dado real.
- **FR-005** — Best-effort por fonte auxiliar: falha em `/options` ou `/:id` degrada o campo (abbreviation null,
  partnersCount 0) sem derrubar a lista; só a falha da lista primária vira erro.
- **FR-006** — Ripple do `id: string` propagado ao slice de detalhe (navegação, `planDetailPlaceholder`,
  `usePlanDetail`/`useOrcamento`) e aos testes. Detalhe segue placeholder (próxima fatia) — real→detalhe cai no
  `not-found` gracioso até a fatia de detalhe.

## Handoffs ao backend (issues abertas)

- **core-api#372** — projetar `partnersCount`/`networkKind` no item da lista (dado já carregado no agregado);
  ao fechar, remove-se o fan-out B1 (troca de 1 linha no adapter).
- **core-api#373** — expor `updatedByRef` (auditoria "por quem"); o BFF passa a compor "por [nome] em [data]".
- **core-api#317/#318** — versionamento/cenários (Fatias 3-4): habilitam `scenarioName` + árvore de versões.

## Fora de escopo

- Detalhe do plano (`GET /:id` completo + árvore `/cost-structure`) — próxima fatia.
- Criar plano (`POST /budget-plans`) e filtros server-side (year/status já suportados; programRef/busca textual
  quando o core expuser) — fatia de options/create.
- Consolidado ABC, Dashboard, Relatórios — sem endpoint real (permanecem placeholder).

## Gate / DoD

- `pnpm verify` verde: typecheck 0 · lint 0 erros / 115 warnings (baseline) · node:test + jsdom passando.
- Validação local contra a `go-live` (dado migrado) na tela `/planejamento`.
