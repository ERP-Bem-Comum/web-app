# Tasks: Consumo da numeração real + programa/classificação de contratos (#32)

**Feature**: `019-contract-number-program` · **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)
**Convenção de IDs**: ADR-0013 (UUID técnico; número humano do backend; sem hashtable; sem brand agora).

> **Legenda**: `[P]` = paralelizável (arquivos distintos, sem dependência pendente) · `[US1]`/`[US2]` = user story.
> **Testes**: `node:test` = puro, `*.test.ts`, imports **relativos** · Vitest = `*.spec.tsx`, aliases `#…`.
> **Invariantes v2** valem em toda task: Result sem throw fora da borda, sem `any`, imutabilidade, só-tokens (`vars.*`), i18n, views burras (sem `useQuery/useMutation` em page/component), boundaries por public-api, Zod na borda.

---

## Phase 1 — Setup (confirmações do contrato #32, bloqueia o resto)

- [X] T001 Ler `../core-api/src/modules/contracts/adapters/http/{contract-dto,schemas}.ts` (branch `feat/backlog-front-handoff`) e registrar em `specs/019-contract-number-program/contracts/api-mapping.md`: (a) nome exato do campo da **sigla** no bloco `program`; (b) se o response traz `programId` cru **além** do bloco `program`; (c) shape exato de `classification`/`budgetPlanId`/`categorizacao`/`centroDeCusto` no response.
- [X] T002 Confirmar o **contrato de listagem de programas** para o seletor (D8): localizar no `#modules/programs/public-api` (front) e/ou no core-api a query/endpoint que lista programas com `{ id: uuid, sigla }`; anotar o nome do fn/options em `api-mapping.md`. Se não existir no front, decidir entre expor via `programs/public-api` ou tratar como follow-up (manter Programa opcional no create).

---

## Phase 2 — Foundational (schemas + model + RED) — BLOQUEIA US1/US2

**RED first (TDD nos pontos puros):**
- [X] T003 [P] node:test (RED) de `formatContractNumber` em `tests/modules/contracts/client/domain/format-classification.test.ts`: `"1/2026"`+`'Contract'` → `CT 0001/2026`; `"12/2026"`+`'ServiceOrder'` → `OS 0012/2026`; sem classification → default CT; formato legado com hífen preservado.
- [X] T004 [P] node:test (RED) do mapper `apiContractToDomain` em `tests/modules/contracts/server/adapters/core-api/contract-mapper.test.ts`: `classification 'CT'→'Contract'` e `'OS'→'ServiceOrder'`; bloco `program`→`{ id:string, name:sigla }`; `programId/budgetPlanId/categorizacao/centroDeCusto` mapeados; **backward-compat**: campos ausentes/`null` → `undefined` (não quebra); **status desconhecido** (`'Cancelled'`) não derruba o parse do item.

**Schemas + model (depois do RED):**
- [X] T005 [US-foundation] Estender `src/modules/contracts/server/adapters/core-api/contracts.schema.ts`: adicionar ao base/list-item e ao detalhe `classification: z.enum(['CT','OS']).nullable().optional()`, `program: z.object({ id: z.string(), <sigla>: z.string() }).nullable().optional()`, `programId/budgetPlanId: z.uuid().nullable().optional()`, `categorizacao/centroDeCusto: z.string().nullable().optional()` (nomes casados com T001).
- [X] T006 [US-foundation] **D9** em `contracts.schema.ts`: adicionar branch de **escape** no `discriminatedUnion` de status (variante base + `status: z.string()`) no list-item e no detalhe, para `'Cancelled'`/status futuros não quebrarem o parse (manter as variantes conhecidas com seus campos condicionais).
- [X] T007 [P] [US-foundation] `src/modules/contracts/client/data/model/contracts.model.ts`: `programId/budgetPlanId` e `program.id`/`budgetPlan.id` → **`z.uuid()` string**; `categorizacao/centroDeCusto` → `z.string()` (nullable/optional); idem em `CreateContractInputSchema` e `ListContractsInputSchema`. **Sem branded type** (ADR-0013).
- [X] T008 [P] [US-foundation] Espelhar a correção de tipos no schema de input das server fns: `src/modules/contracts/server/adapters/contracts.schemas.ts` (`programId/budgetPlanId` `z.number()`→`z.uuid()`; `categorizacao/centroDeCusto`→string) — manter consistência com o model (anomalia espelhada).

**Checkpoint Phase 2**: `pnpm typecheck` deve falhar só onde o mapper/grid/controller ainda usam os tipos antigos (será resolvido em US1) — os schemas/model já compilam isolados; T003/T004 ainda RED (mapper não implementado).

---

## Phase 3 — US1: Numeração confiável + criação aderente (P1) 🎯 MVP

**Goal**: o sistema atribui o número (CT/OS NNNN/AAAA), o app não inventa número, e o create funciona no #32.
**Independent test**: criar CT e OS → número real exibido com prefixo correto; criar dois no ano → números distintos/crescentes (quickstart §2–3,5).

- [X] T009 [US1] Mapper `src/modules/contracts/server/adapters/core-api/core-api-contracts.ts` (`apiContractToDomain`): mapear `classification` (`'OS'→'ServiceOrder'`, default `'Contract'`), `program`→`{id,name:sigla}`, `programId/budgetPlanId/categorizacao/centroDeCusto` (`?? undefined`) — **remover os hardcodes** `classification:'Contract'`/`program:undefined`/etc. → **faz T004 passar (GREEN)**.
- [X] T010 [US1] Mapper: **degradar status desconhecido** (do branch de escape D9) sem zerar o item — mapear `'Cancelled'`/desconhecido para um valor de status seguro de exibição (sem quebrar o `switch` exaustivo da UI); documentar no código que a UI de cancelamento é slice futuro.
- [X] T011 [US1] Create em `core-api-contracts.ts`: **remover** o `sequentialNumber: ${Math.random()...}` do body; mapear `classification` domínio→wire (`'ServiceOrder'→'OS'`, senão `'CT'`); manter `mode:'Pending'` (D7); omitir `programId/budgetPlanId` quando vazios.
- [X] T012 [US1] Grid `src/modules/contracts/client/contract-list/components/contract-row.component.tsx`: passar a `classification` real do contrato para `formatContractNumber(code, classification)` (prefixo CT/OS de verdade) → **faz T003 passar (GREEN)** no consumo real.
- [X] T013 [P] [US1] Controller `src/modules/contracts/client/contract-create/components/contract-form.controller.ts`: estado `programId/budgetPlanId: string | null`, `categorizacao/centroDeCusto: string | null`; `submit()` monta `CreateContractInput` com os tipos novos, **sem** `sequentialNumber`.
- [X] T014 [P] [US1] node:test do `submit()` do controller em `tests/modules/contracts/client/contract-create/contract-form-controller.test.ts`: monta input com `programId` string (quando selecionado), `classification` correta, **sem** `sequentialNumber`; campos opcionais omitidos quando vazios.

**Checkpoint US1**: `pnpm typecheck` limpo; T003/T004/T014 GREEN; criar contrato no #32 (sem programa) conclui e exibe número real (validar em tela na Phase 5).

---

## Phase 4 — US2: Programa e metadados visíveis (P2)

**Goal**: grid e detalhe mostram Programa (sigla) + metadados em vez de "—".
**Independent test**: contrato com programa → coluna Programa = sigla; sem programa → "—" (quickstart §4,5).

- [X] T015 [US2] Grid `contract-row.component.tsx`: coluna **Programa** = `contract.program?.name ?? '—'` (substituir o "—" fixo); manter centralização/estilo só-tokens.
- [X] T016 [US2] Detalhe `src/modules/contracts/client/contract-detail/page/contract-detail.page.tsx`: campos **Programa / Plano Orçamentário / Categorização / Centro de Custo** lidos do contrato (`?? '—'`), substituindo os "—" fixos; só-tokens.
- [ ] T017 [P] [US2] Vitest DOM `tests/modules/contracts/client/ui/contract-row-program.spec.tsx`: contrato com `program` → célula mostra a sigla; sem `program` → "—".
- [ ] T018 [P] [US2] Vitest DOM `tests/modules/contracts/client/ui/contract-detail-metadata.spec.tsx`: detalhe renderiza Programa/Plano/Categorização/Centro de Custo quando presentes; "—" quando ausentes.

**D8 — Seletor de programa real (UUID)** ⚠️ *maior risco; se inflar, manter Programa opcional no create e parar aqui (US1 + leitura já entregam o MVP):*
- [X] T019 [US2] `src/modules/contracts/client/contract-create/contract-create.binding.ts`: `useQuery` da listagem de programas via `#modules/programs/public-api` (conforme T002); expor estado de opções (loading/erro tolerados).
- [X] T020 [US2] `src/modules/contracts/client/contract-create/contract-create.view-model.ts`: derivação pura das opções `{ value: program.id (uuid), label: sigla }` para a view (sem React).
- [X] T021 [US2] `src/modules/contracts/client/contract-create/components/contract-form.component.tsx`: trocar as `<option>` **mock numéricas** de Programa por opções reais (props da ViewModel); `onChange('programId', value)` **sem** `Number(...)`. budgetPlan: manter opcional/sem opções reais nesta fatia.
- [ ] T022 [P] [US2] Vitest DOM `tests/modules/contracts/client/contract-create/program-select.spec.tsx`: com query mockada, o `<select>` de Programa renderiza as opções reais (uuid→sigla) e atualiza o estado com a string UUID.

---

## Phase 5 — Polish & validação

- [X] T023 `pnpm verify` (typecheck + lint + node:test) e `pnpm test:dom` (vitest) — 0 erros de typecheck; 0 errors no lint (warnings = baseline); todos os testes verdes.
- [X] T024 Revisão de **boundaries/lint**: confirmar que o import `contracts → programs` é via `public-api` (D8), views permanecem burras, e nenhum literal de UI/hex/px cru entrou.
- [ ] T025 Validação em tela (`https://app.localhost`, `admin.full@bemcomum.dev`/`DevPassw0rd!2024`) conforme `quickstart.md`: criar **CT** e **OS** (número real + prefixo correto), criar com **programa** (coluna Programa = sigla), criar **sem** programa ("—"), e sad-path (erro do backend → tag i18n). Sem regressão no grid/detalhe/demais módulos.
- [X] T026 Atualizar `contracts/api-mapping.md` com quaisquer ajustes finais de nomes de campo descobertos no implement; marcar as 3 confirmações (T001/T002) como resolvidas.

---

## Dependências (ordem de conclusão)
- **Phase 1 (T001–T002)** antes de tudo (resolve nomes de campo + contrato de programas).
- **Phase 2 (T003–T008)** bloqueia US1/US2: RED (T003/T004) → schemas (T005/T006) → model/inputs (T007/T008).
- **US1 (T009–T014)** depende de Phase 2; é o **MVP** (numeração + create aderente + leitura de classificação).
- **US2 (T015–T022)** depende de Phase 2 (leitura) e de T002 (D8/seletor). T015–T018 (leitura) independem de T019–T022 (create selector).
- **Phase 5** por último.

## Paralelização
- Phase 2: `T003 ∥ T004` (testes RED, arquivos distintos); `T007 ∥ T008` (model ∥ server input schema) após T005/T006.
- US1: `T013 ∥ T014` (controller ∥ teste) em paralelo ao mapper/grid (T009–T012) — arquivos distintos.
- US2: `T017 ∥ T018 ∥ T022` (specs DOM, arquivos distintos).

## MVP sugerido
**US1 (T001–T014)** entrega o núcleo: número real + classificação CT/OS + create aderente (sem quebrar inclusão). US2 (programa visível + seletor real) é incremento de leitura/UX em cima do MVP.

## Confirmações abertas (resolver em T001/T002 durante o implement)
1. Nome exato do campo da **sigla** no bloco `program` do #32.
2. Se o response traz `programId` cru além do bloco `program`.
3. Contrato da **listagem de programas** para o seletor (D8) — existe no front? expor via `programs/public-api`?
