# Tasks: Geografia de Parceria (partners)

**Feature**: `014-geography-screens` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Tamanho**: M. **TDD**. UI PRÓPRIA (não CRUD): 2 painéis (estados → municípios), toggle otimista.
RBAC `geography:read|write`. Rota `/parceiros/territorios`.

## Phase 1: Setup
- [x] T001 Criar `src/modules/partners/client/geography/{page,components}` + `tests/.../geography` + rota dir.
- [x] T002 [P] i18n `partners.geography.*` em `catalog.pt-BR.ts` (title/subtitle, states/municipalities painéis, select-state-hint, empty/loading, toggle aria).

## Phase 2: Foundational
- [x] T003 [P] `data/model/geography.model.ts`: `PartnerState`, `PartnerMunicipality`, inputs (`ToggleStateInput`, `ToggleMunicipalityInput`, `ListMunicipalitiesInput`).
- [x] T004 `data/repository/geography.repository.ts` + `.instance.ts` (4 fns → Result; reusa `partners-error.ts`). (dep T003)
- [x] T005 [P] `tests/.../data/repository/geography.repository.test.ts` (RED): map `{ok,data|error}`→Result p/ as 4 fns.
- [x] T006 Implementar `geography.repository.ts` até T005 GREEN. (dep T005)

## Phase 3: View-model puro (núcleo agnóstico)
- [x] T007 [P] `tests/.../geography/geography.view-model.test.ts` (RED): `sortStates` (por uf), `sortMunicipalities` (por name), `applyStateToggle`/`applyMunicipalityToggle` (retorna nova lista c/ isPartner trocado no item-alvo; imutável), `countPartners`.
- [x] T008 `geography/geography.query.ts` (statesQueryOptions, municipalitiesQueryOptions(uf)) + `geography.view-model.ts` (derivações puras). (até T007 GREEN)

## Phase 4: US1 Estados (P1) 🎯 MVP
- [x] T009 [US1] `geography/geography.binding.ts` — useQuery(states) + useMutation(toggleState) otimista (onMutate setQueryData via `applyStateToggle`; onError rollback; pending desabilita) + `canWrite` (geography:write) + estado `selectedUf` (useState). Expõe estados, municípios e os comandos.
- [x] T010 [P] [US1] `geography/components/territory-list.component.tsx` (+ css) — lista BURRA genérica: `items: {key,label,checked}[]`, `onToggle(key, checked)`, `disabled`, `emptyLabel`, `loading`. Usa `Checkbox` do DS.
- [x] T011 [US1] `geography/page/geography.page.tsx` (+ css) — 2 painéis; painel esquerdo = estados (territory-list ligada ao binding). (dep T009, T010)
- [x] T012 [US1] Rota `routes/_authenticated/parceiros/territorios/index.tsx` (component = page) + regenerar routeTree. (dep T011)
- [x] T013 [US1] Suites US1 GREEN + lint.

## Phase 5: US2 Municípios (P1)
- [x] T014 [US2] Estender `geography.binding.ts`: useQuery(municipalities, selectedUf) (enabled quando há UF) + useMutation(toggleMunicipality) otimista (rollback). (dep T009)
- [x] T015 [US2] Painel direito na `geography.page.tsx`: ao selecionar um estado (clique no item da lista esquerda → `selectedUf`), mostra `territory-list` de municípios; sem seleção → hint "selecione um estado". (dep T011, T014)
- [x] T016 [US2] Suites US2 GREEN + lint (DOM do territory-list: toggle dispara, disabled respeitado).

## Phase 6: Polish
- [x] T017 [P] Menu: subitem "Geografia" sob "Gestão de Parceiros" → `/parceiros/territorios`, `requiredPermission: 'geography:read'`.
- [x] T018 Estender regressão de menu em `root.view-model.test.ts`: com `geography:read` o subitem "Geografia" aparece; sem ele, não; seção com os 4 reads mostra os 4 subitens. (dep T017; não [P])
- [x] T019 [P] Revisar i18n: sem literais; todas as tags `partners.geography.*` existem.
- [x] T020 Gate final: `pnpm verify` + `pnpm test:dom` verdes; boundaries (views sem data-hooks; UI-state no binding).
- [ ] T021 (Opcional) Baseline visual da tela de geografia.

## Dependencies
Setup → Foundational → view-model → US1 (estados) → US2 (municípios) → Polish. Rota (T012) regenera routeTree.
## MVP
US1 (estados) entrega a seleção territorial por estado. US2 adiciona o nível município.
