# Implementation Plan: Inclusão de Colaborador (Novo Colaborador)

**Branch**: `feat/contracts-detail-and-partners` (spec dir `018-collaborator-create`) | **Date**: 2026-06-08 | **Spec**: [spec.md](./spec.md)

## Summary

Adicionar o fluxo de **criação de colaborador** no front (web-app v2), espelhando `supplier-create`. O
backend/BFF/client-data já está pronto (`create-collaborator.service.fn`, `collaboratorRepository.create`).
Entregar: slice `collaborator-create` (page + form + binding + mutation + view-model), a rota file-based
`/parceiros/colaboradores/criar`, e o botão **Novo** na listagem (gated por `collaborator:write`).

## Technical Context

**Language/Version**: TypeScript strict (erasableSyntaxOnly)
**Primary Dependencies**: TanStack Start/Router/Query, React 19, vanilla-extract, Zod 4
**Storage**: N/A no front (persistência via core-api, já pronta)
**Testing**: node:test (puros: view-model/controller) + Vitest/jsdom (DOM: form/page)
**Target Platform**: Web (SSR + client)
**Project Type**: web-app (front + BFF unificado)
**Scope**: 1 tela nova + 1 botão na lista + 1 rota. ~8 arquivos novos, ~2 edições.

## Constitution Check

*GATE: frontend-only — não toca `src/` do core-api.* Respeita as invariantes v2:
- ✅ Result<T,E> sem throw fora da borda (a borda é a server fn já existente).
- ✅ Sem `class`/`any`; imutabilidade; enums via união de literais.
- ✅ Design system só-tokens (`vars.*`); strings de UI = tags i18n.
- ✅ MVVM views burras: page/component sem `useQuery`/`useMutation` (vive no binding/controller).
- ✅ Fronteiras por public-api/boundaries; naming por postfix.
- ✅ Aditivo, sem regressão. **Sem violações** (sem ADR necessário).

## Project Structure — mapeamento (análogo em supplier-create)

### Novos (`src/modules/partners/client/collaborator-create/`)
| Novo arquivo | Análogo | Papel |
|---|---|---|
| `collaborator-create.mutation.ts` | `supplier-create.mutation.ts` | key `['collaborators','create']` + mutationFn → `collaboratorRepository.create` |
| `collaborator-create.view-model.ts` | idem supplier | mutation options + `toErrorTag` + `unexpectedErrorTag` |
| `collaborator-create.binding.ts` | idem supplier | `useMutation`→Command; onSuccess invalida `['collaborators']` + navega `/parceiros/colaboradores`; `canWrite` |
| `components/collaborator-form.controller.ts` | `supplier-form.controller.ts` | estado do form + `submit()` montando o input; validação na borda |
| `components/collaborator-form.component.tsx` | `supplier-form.component.tsx` | view burra (só-tokens): inputs + selects de enum |
| `components/collaborator-form.css.ts` | `supplier-form.css.ts` | estilos só-tokens |
| `page/collaborator-create.page.tsx` | `supplier-create.page.tsx` | PageHeader + form + binding |
| `page/collaborator-create.css.ts` | `supplier-create.css.ts` | estilos da página |

### Rota (composition root)
`src/routes/_authenticated/parceiros/colaboradores/criar.tsx` (espelha `.../fornecedores/criar.tsx` — importa a page direto, **sem** public-api).

### Edições
- `collaborator-list/page/collaborator-list.page.tsx`: destruturar `canCreate` do binding + botão **Novo** no `PageHeader actions` → `/parceiros/colaboradores/criar` (espelha `supplier-list.page.tsx:84`).
- `src/shared/i18n/catalog.pt-BR.ts`: tags `partners.collaborators.create.*` (título/subtítulo, labels dos 7 campos, botão salvar/cancelar). Enums já têm i18n (`area.*` PARC/DDI/DCE/EPV, `employment.*` CLT/PJ).

## Phase 0 — Research
Sem incógnitas — ver [research.md](./research.md).

## Phase 1 — Design
- [data-model.md](./data-model.md): campos do form, enums, validação na borda.
- [quickstart.md](./quickstart.md): cenários de validação em tela + testes.
- Contrato de interface = a tela/form (UI contract, no data-model); a fronteira RPC já existe.
