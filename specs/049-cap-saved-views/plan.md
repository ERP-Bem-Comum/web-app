# Implementation Plan: Visões salvas (saved views) — Contas a Pagar

**Branch**: `049-cap-saved-views` · **Spec**: [spec.md](./spec.md) · **Issue**: core-api#351 (camada FE/BFF)

**Escala**: M (feature pequena, front-first). **Fonte**: §XI (MVVM/views burras), §X (só-tokens), §II
(erros como valores), §VII (imutabilidade), ADR-0004/0009/0012.

## Contexto arquitetural

A listagem de Contas a Pagar vive em `src/modules/financial/client/contas-a-pagar-list/`. O estado dos
filtros é **UI-state** (não URL, não server-state): mora em `useState` no `contas-a-pagar.binding.ts`
(`selectedStatus`, `activeDims: Set<FilterDimId>`, `filters: AdvancedFilters`). Uma **visão salva** é um
snapshot nomeado de `{ status, dims, filters }` — também preferência de UI.

## Camadas (fluxo `data → view-model → ui`, núcleo agnóstico de framework)

### 1. ViewModel PURO — `contas-a-pagar-saved-views.view-model.ts`

- Tipo `SavedView = Readonly<{ id; name; status; dims; filters }>` (espelha o shape dos filtros existentes).
- `captureView(name, status, dims, filters): Omit<SavedView,'id'>` — snapshot (com `trim` do nome, cópia
  defensiva de `dims`). O `id` é responsabilidade do binding (I/O).
- `serializeViews(views): string` = `JSON.stringify`.
- `parseViews(raw): readonly SavedView[]` — **tolerante** (§II): `null`/vazio/JSON corrompido/não-array →
  `[]`; entradas individuais inválidas descartadas; validação **manual** (sem Zod — mínimo de deps §VIII),
  sanitizando `dims` e cada campo de `AdvancedFilters`.
- SEM `react`, SEM `@tanstack/*`, SEM `localStorage`. Importa só a view-model principal (uniões/constantes).

### 2. Binding (persistência + aplicar)

- Novo `contas-a-pagar-saved-views.binding.ts` → `useSavedViews(snapshot, applyView)`: dono do I/O
  (localStorage + `crypto.randomUUID` com fallback). **Não** é dono do estado dos filtros — recebe o
  snapshot atual (para capturar) e um `applyView` (para reconstruir o estado). Expõe `savedViews`,
  `onSaveView(name)`, `onApplyView(id)`, `onDeleteView(id)`.
  - Persistência: **localStorage**, chave versionada `cap.savedViews.v1`; leitura lazy no init (via
    `parseViews`, tolerante), escrita a cada mudança (`serializeViews`). Falha de storage → silenciosa
    (segue em memória).
- Integração no `contas-a-pagar.binding.ts` (dono do estado): implementa `applyView` com um **único update**
  (`setSelectedStatus` + `setActiveDims(new Set(dims))` + `setFilters` + `setPage(1)`, auto-batched → 1
  render, não N setters encadeados). Reexporta os 4 campos em `ContasAPagarBinding`.

### 3. UI — view burra `saved-views-menu.component.tsx`

- `SavedViewsMenu` (pele "brand", igual ao `AddFilterButton`): (a) salvar visão atual (input de nome +
  Salvar, desabilitado se vazio); (b) lista as visões → clicar **aplica**; (c) × exclui cada uma.
- Recebe tudo por props/binding (§XI); menu aberto/fechado controlado pelo pai; nome digitado = input
  controlado local (UI-state transiente). Não importa `data`/`usecase`/`repository`/`server-fn`.
- Estilos em `page/contas-a-pagar.css.ts` (só-tokens §X), reusando as peles de menu/chip existentes.
- i18n `financial.list.savedViews.*` no `catalog.pt-BR.ts`.
- Ligado na `contas-a-pagar.page.tsx` (filter-bar, ao lado do "Adicionar filtro").

## Boundaries (o lint cobra)

- Núcleo puro (`*.view-model.ts`) não importa `react`/`@tanstack/*`/`localStorage`. ✔ (I/O no binding.)
- View burra não importa `data`/`usecase`/`binding` de dados — só o tipo `SavedView` da view-model. ✔
- server-state (TanStack Query) intocado; visões são UI-state persistido no navegador. ✔

## Testes

- **node:test** (`tests/.../contas-a-pagar-list/saved-views-view-model.test.ts`): captureView, round-trip
  serialize/parse, tolerância do parse (lixo/JSON inválido/não-array → []; descarta entradas inválidas;
  sanitiza dims/filters).
- **Vitest/jsdom** (`tests/.../contas-a-pagar/saved-views-menu.spec.tsx`): salvar dispara `onSaveView(nome)`;
  lista + aplicar dispara `onApplyView(id)`; excluir dispara `onDeleteView(id)`; vazio/desabilitado.
- Sem non-null assertion `!` (guarda explícita).

## Gates

`pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom` — baseline lint 0 erros/115
warnings. NÃO commitar, NÃO rebuildar Docker.

## Extensibilidade (#164)

O shape de `AdvancedFilters` é a fonte da verdade do que a visão guarda. Quando os predicados do #164
(valor, contrato, programa, nº doc, CNPJ/CPF) entrarem no `AdvancedFilters`, `captureView`/aplicar os levam
de graça; só o `parseFilters` (validação tolerante) precisa reconhecer os novos campos.
