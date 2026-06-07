# Tasks: RBAC do menu de fornecedores

**Feature**: `011-supplier-menu-rbac` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Tamanho**: S (1 linha de config de produção + teste de regressão). Abordagem **TDD**: o teste
de regressão sobre o `MENU` real é escrito **antes** e falha (RED) porque hoje o subitem
"Fornecedores" não exige permissão; a edição da config o torna verde (GREEN).

**Arquivos-alvo**:
- `tests/modules/shell/client/root/root.view-model.test.ts` (estender — teste de regressão)
- `src/modules/shell/client/data/menu/shell-menu.config.ts` (editar — 1 linha)
- `src/modules/shell/client/root/viewModel/root.view-model.ts` (referência — **sem alteração**)

---

## Phase 1: Setup

- [x] T001 Confirmar baseline verde antes de mexer: rodar `node --experimental-strip-types --test tests/modules/shell/client/root/root.view-model.test.ts` e garantir que a suíte atual (menu sintético) passa.

---

## Phase 2: Foundational

> Nenhuma task — a infraestrutura (`visibleMenu`, campo `requiredPermission`, cadeia de
> `permissions[]` ligada de ponta a ponta) já existe. Nada bloqueia as user stories.

---

## Phase 3: User Story 1 — Sem `supplier:read` esconde a entrada (Priority: P1)

**Goal**: usuário sem a permissão não vê o subitem "Fornecedores" e, por consequência, a seção
"Gestão de Parceiros" (accordion vazio) desaparece.

**Independent Test**: `visibleMenu(MENU, [])` e `visibleMenu(MENU, ['user:read'])` (qualquer
conjunto sem `supplier:read`) não contêm o subitem "Fornecedores" nem a seção "Gestão de Parceiros".

- [x] T002 [US1] Escrever teste de regressão RED em `tests/modules/shell/client/root/root.view-model.test.ts`: novo bloco `describe('rootViewModel.visibleMenu (MENU real — fornecedores)')` importando o `MENU` real de `src/modules/shell/client/data/menu/shell-menu.config.ts` (import relativo, regra do node:test), asserindo que `visibleMenu(MENU, [])` NÃO contém seção `label === 'Gestão de Parceiros'` e NÃO contém subitem `label === 'Fornecedores'`; idem para `visibleMenu(MENU, ['user:read'])`. Confirmar que falha (RED) com a config atual.

---

## Phase 4: User Story 2 — Com `supplier:read` mostra a entrada (Priority: P1)

**Goal**: usuário com a permissão vê a seção "Gestão de Parceiros" e o subitem "Fornecedores"
apontando para a listagem, sem regressão.

**Independent Test**: `visibleMenu(MENU, ['supplier:read'])` contém a seção "Gestão de Parceiros"
com o subitem "Fornecedores" cujo `to === '/parceiros/fornecedores'`.

- [x] T003 [US2] Estender o mesmo bloco de teste em `tests/modules/shell/client/root/root.view-model.test.ts` com o caso positivo: `visibleMenu(MENU, ['supplier:read'])` contém a seção `label === 'Gestão de Parceiros'`, e dentro dela o subitem `label === 'Fornecedores'` com `to === '/parceiros/fornecedores'`.

---

## Phase 5: Implementação (habilita US1 + US2)

> A mesma mudança de **uma linha** satisfaz as duas user stories (torna o RED de T002/T003 verde).

- [x] T004 Editar `src/modules/shell/client/data/menu/shell-menu.config.ts`: no subitem `{ label: 'Fornecedores', to: '/parceiros/fornecedores' }` da seção "Gestão de Parceiros", adicionar `requiredPermission: 'supplier:read'`. Reusar o slug do catálogo `PARTNER_PERMISSIONS` (valor string literal — sem import cross-módulo). Rodar o teste e confirmar GREEN.

---

## Phase 6: Polish & Cross-Cutting

- [x] T005 Conferir o checklist de conformidade do `quickstart.md` (views burras intactas, núcleo agnóstico sem React, boundaries, imutabilidade, degradação `[]`→esconde).
- [x] T006 Gate final: `pnpm verify` (typecheck + lint + test) verde.

---

## Dependencies & Execution Order

- **Setup (T001)** → **US1 (T002, RED)** → **US2 (T003, RED+)** → **Implementação (T004, GREEN)** → **Polish (T005, T006)**.
- T002 e T003 editam o **mesmo arquivo** de teste → **sequenciais** (sem `[P]`).
- T004 depende de T002+T003 existirem (TDD: vê o RED virar GREEN).
- US1 e US2 são logicamente independentes (casos negativos × positivo), mas ambas P1 e ambas
  habilitadas por T004 — não há MVP parcial útil que entregue uma sem a outra.

## Parallel Opportunities

- Nenhuma significativa: feature S, arquivos compartilhados, fluxo estritamente sequencial (TDD).

## MVP Scope

- **MVP = US1 + US2 juntas** (T001→T004). São a mesma linha de config + um bloco de teste; separá-las
  não gera incremento entregável isolado. T005/T006 são o fechamento de qualidade.

## Formato

- Todas as tasks seguem `- [ ] [TaskID] [P?] [Story?] descrição com caminho de arquivo`.
- Labels de story (`[US1]`/`[US2]`) só nas fases de user story; Setup/Implementação/Polish sem label.
