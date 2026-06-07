---

description: "Task list — Fundação de Organismos (Design System)"
---

# Tasks: Fundação de Organismos (Design System)

**Input**: Design documents from `specs/009-design-system-organisms/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: INCLUÍDOS — o projeto exige TDD ("escreva o teste antes"; AGENTS.md). Testes de DOM (vitest + @testing-library/react, `*.spec.tsx`) escritos **antes** da implementação (RED → GREEN). Baselines visuais (Playwright) gerados por último.

**Escopo (confirmado)**: apenas **P1** — `DataTable` (US1) e `PageHeader` (US2). US3–US5 fora. `contracts` não migrado.

**Organization**: tasks agrupadas por user story para entrega/teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 (DataTable) ou US2 (PageHeader)
- Caminhos de arquivo são relativos à raiz do `web-app`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: estrutura de pastas da nova camada de organismos.

- [x] T001 Criar diretório `src/shared/ui/organisms/` e o barrel placeholder `src/shared/ui/organisms/index.ts` (vazio — sem exports ainda)
- [x] T002 [P] Criar diretório de testes `tests/shared/ui/organisms/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ligar a camada de organismos à porta pública `#shared/ui`, habilitando o alias para os testes de DOM. Confirmar que o lint já reconhece a camada.

**⚠️ CRITICAL**: bloqueia as user stories (os `*.spec.tsx` importam de `#shared/ui`).

- [x] T003 Conectar o barrel raiz: adicionar `export * from './organisms/index.ts'` em `src/shared/ui/index.ts` (no ponto já comentado para organisms). Com `organisms/index.ts` vazio, re-exporta nada — build/typecheck permanecem verdes.
- [x] T004 [P] Verificar (sem alterar) que `eslint.config.js` já define `ds-organism` (`src/shared/ui/organisms`) e a regra "só-tokens" cobre `organisms/**` — rodar `pnpm lint` para confirmar baseline verde antes de começar.

**Checkpoint**: camada de organismos plugada na porta pública; `#shared/ui` resolve; lint verde. User stories podem começar.

---

## Phase 3: User Story 1 - Tabela de dados genérica (Priority: P1) 🎯 MVP

**Goal**: `DataTable<T>` agnóstico de domínio, com colunas configuráveis e estados loading/error/ready(+empty), consumível via `#shared/ui`.

**Independent Test**: renderizar a tabela com colunas+linhas fictícias e alternar `state` entre os 4 cenários, verificando o render correto de cada um — isolado, sem backend (`pnpm test:dom tests/shared/ui/organisms/data-table.spec.tsx`).

### Tests for User Story 1 (TDD — escrever PRIMEIRO, devem FALHAR) ⚠️

- [x] T005 [P] [US1] Escrever `tests/shared/ui/organisms/data-table.spec.tsx` cobrindo os 5 critérios do contrato (ready com linhas → valores nas colunas certas na ordem; ready com `rows: []` → `emptyLabel`; loading → indicador `role="status"`, nenhuma linha; error → `state.message`; `column.cell` retornando um `<Badge>` → célula renderiza o badge). Garantir que FALHA por inexistência do `DataTable`.

### Implementation for User Story 1

- [x] T006 [P] [US1] Criar `src/shared/ui/organisms/data-table/data-table.types.ts` com `ColumnAlign`, `ColumnWidth`, `Column<T>`, `DataTableState<T>` (união discriminada loading/error/ready), `DataTableProps<T>` (conforme data-model.md). `Readonly`/`readonly`, sem `any`, sem `enum`.
- [x] T007 [P] [US1] Criar `src/shared/ui/organisms/data-table/data-table.css.ts` (vanilla-extract) — container/scroll, `table`, `thead` sticky, classes de alinhamento e larguras (`narrow|normal|wide`) mapeadas a tokens, estados (loading/empty/error). **Somente `vars.*`** — sem hex/rgb/hsl/px crus.
- [x] T008 [US1] Criar `src/shared/ui/organisms/data-table/data-table.component.tsx` — view burra genérica `<T>`: `<table>` semântico (`<th scope="col">`), `switch (state.status)` exaustivo com `const _: never`, render de `loading` (indicador + `role="status"` + `loadingLabel`), `error` (`message`), `ready` (vazio → `emptyLabel`; com linhas → `rows` × `columns` via `rowKey`/`column.cell`). Sem data-hooks, sem estado de negócio. (depende de T006, T007)
- [x] T009 [US1] Criar `src/shared/ui/organisms/data-table/index.ts` re-exportando `DataTable` + tipos públicos (`Column`, `ColumnAlign`, `ColumnWidth`, `DataTableState`, `DataTableProps`); adicionar `export * from './data-table/index.ts'` em `src/shared/ui/organisms/index.ts`. (depende de T008)
- [x] T010 [US1] Rodar `pnpm test:dom tests/shared/ui/organisms/data-table.spec.tsx` até GREEN e `pnpm lint` (boundaries + só-tokens) verde para os arquivos novos. (depende de T009)

**Checkpoint**: `DataTable` funcional, testado isoladamente, importável de `#shared/ui`, lint verde. ✅ MVP entregue.

---

## Phase 4: User Story 2 - Cabeçalho de página (Priority: P1)

**Goal**: `PageHeader` com título, subtítulo opcional e slot de ações.

**Independent Test**: renderizar com título + `<Button>` no slot e verificar ambos; renderizar só com título e verificar layout íntegro (`pnpm test:dom tests/shared/ui/organisms/page-header.spec.tsx`).

### Tests for User Story 2 (TDD — escrever PRIMEIRO, devem FALHAR) ⚠️

- [x] T011 [P] [US2] Escrever `tests/shared/ui/organisms/page-header.spec.tsx` cobrindo: título sempre renderiza; `actions` (um `<Button>`) renderiza no slot; sem `subtitle`/`actions` mantém a estrutura. Garantir que FALHA por inexistência do `PageHeader`.

### Implementation for User Story 2

- [x] T012 [P] [US2] Criar `src/shared/ui/organisms/page-header/page-header.css.ts` (vanilla-extract) — layout título/subtítulo/ações, responsivo, **somente `vars.*`**.
- [x] T013 [US2] Criar `src/shared/ui/organisms/page-header/page-header.component.tsx` — view burra: `title` (obrigatório), `subtitle?`, `actions?: ReactNode` (slot por composição). Props `Readonly<>`, sem lógica de negócio. (depende de T012)
- [x] T014 [US2] Criar `src/shared/ui/organisms/page-header/index.ts` re-exportando `PageHeader` + `PageHeaderProps`; adicionar `export * from './page-header/index.ts'` em `src/shared/ui/organisms/index.ts`. (depende de T013)
- [x] T015 [US2] Rodar `pnpm test:dom tests/shared/ui/organisms/page-header.spec.tsx` até GREEN e `pnpm lint` verde para os arquivos novos. (depende de T014)

**Checkpoint**: `DataTable` e `PageHeader` ambos funcionais e importáveis de `#shared/ui`.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: documentação, regressão visual e gate final (afetam ambos os organismos).

- [x] T016 [P] Atualizar `src/shared/ui/README.md`: listar os organismos `DataTable` e `PageHeader` (porta `#shared/ui`, resumo de props), e **remover** a marcação "`organisms/` virá em spec futura".
- [x] T017 Criar o harness de showcase para baseline visual (R8): rota dev isolada sob `src/routes/` (com guard de ambiente) **ou** harness equivalente que renderize `DataTable` nos 4 estados e `PageHeader` com/sem ações de forma determinística (aguardar `document.fonts.ready`). Decidir o mecanismo na implementação conforme o padrão de `e2e/visual` existente.
- [x] T018 Criar `e2e/visual/organisms.visual.e2e.ts` com `toHaveScreenshot` por estado: DataTable (loading, error, empty, ready-com-dados) e PageHeader (com ações, sem ações). (depende de T017)
- [x] T019 Gerar a baseline oficial `-linux` via Docker e **commitar os `.png`** junto (⚠️ revisão humana do diff — **nunca** `test:visual:update` sem aprovação). Guia: `.claude/guides/visual-testing.md`. (depende de T018)
- [x] T020 Validar o `quickstart.md`: confirmar que o esqueleto de listagem (PageHeader + DataTable) compila/typecheca usando só `#shared/ui` (sem componente local de tabela/cabeçalho).
- [x] T021 Gate final: rodar `pnpm verify` (typecheck + lint + test) e `pnpm test:dom` — tudo verde. Confirmar nenhum import de `modules/`/`data/`/`server/` dentro de `organisms/` e nenhuma cor/medida crua.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende do Setup. **Bloqueia** as user stories (alias `#shared/ui`).
- **US1 (Phase 3)** e **US2 (Phase 4)**: dependem da Foundational. São **independentes entre si** (arquivos/pastas distintos) — podem ser paralelizadas. Ambas P1.
- **Polish (Phase 5)**: depende de US1 **e** US2 completas (showcase e doc cobrem os dois).

### Within Each User Story

- Teste (`*.spec.tsx`) escrito e **falhando** antes da implementação.
- Tipos/CSS antes do componente; componente antes do barrel; barrel antes do gate verde.

### Parallel Opportunities

- T001 / T002 (setup) em paralelo.
- Dentro de US1: T005 (teste), T006 (types), T007 (css) em paralelo; T008 depende de T006+T007.
- Dentro de US2: T011 (teste), T012 (css) em paralelo; T013 depende de T012.
- **US1 e US2 inteiras** podem correr em paralelo após a Foundational (não compartilham arquivos; o `organisms/index.ts` recebe um `export` de cada — coordenar essa linha para evitar conflito de merge).
- T016 (README) em paralelo com o resto do Polish.

---

## Parallel Example: User Story 1

```bash
# Após a Foundational, iniciar em paralelo dentro de US1:
Task: "Escrever tests/shared/ui/organisms/data-table.spec.tsx (RED)"
Task: "Criar src/shared/ui/organisms/data-table/data-table.types.ts"
Task: "Criar src/shared/ui/organisms/data-table/data-table.css.ts"
# Depois (sequencial): data-table.component.tsx → index.ts → test:dom GREEN
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 (DataTable).
4. **STOP & VALIDATE**: `pnpm test:dom` do DataTable verde + lint verde → MVP da camada de organismos provado.

### Incremental Delivery

1. Setup + Foundational → camada plugada.
2. US1 (DataTable) → testa isolado → o organismo de maior alavancagem está pronto.
3. US2 (PageHeader) → testa isolado.
4. Polish → README + baselines visuais + gate `pnpm verify`.

---

## Notes

- [P] = arquivos diferentes, sem dependência pendente.
- Coordenar as duas linhas que editam `src/shared/ui/organisms/index.ts` (T009 e T014) se US1/US2 correrem em paralelo.
- Verificar que os testes FALHAM antes de implementar.
- Commits: `feat(<bc>/organisms): …` (ex.: `feat(ui/organisms): átomo composto DataTable`). Nunca heredoc. PR aponta para `develop`.
- `pnpm test:visual` exige a stack de pé (`../ERP-INFRA/local/up.sh`); baseline `-linux` é a oficial.
- **Total: 21 tasks** (Setup 2 · Foundational 2 · US1 6 · US2 5 · Polish 6).
