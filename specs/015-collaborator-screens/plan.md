# Implementation Plan: Telas de Colaboradores (partners)

**Branch**: `develop` (feature dir `specs/015-collaborator-screens`) | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-collaborator-screens/spec.md`

## Summary

Construir a **camada client** do submódulo Colaboradores (web-app/v2, módulo vertical `partners`),
fechando a US1/P1 do épico 008. **Frontend-only**: o core-api (`collaboratorsHttpPlugin`) e o BFF (8
server-fns em `src/modules/partners/server/adapters/server-fns/collaborator/`) já existem e são
reaproveitados sem alteração. A abordagem é **espelhar fielmente o submódulo ACT** (`act-*`), que tem o
molde mais próximo (list + create + edit + detail), adicionando duas peças que o ACT não tem:
**complete-registration** (cadastro em 2 etapas) e **import CSV**.

## Technical Context

**Language/Version**: TypeScript 6 (strict, `erasableSyntaxOnly`), React 19
**Primary Dependencies**: TanStack Start/Router/Query, vanilla-extract, Zod 4 (já no projeto)
**Storage**: N/A no client — persistência via core-api (MySQL) através das server-fns existentes
**Testing**: `node:test` (`*.test.ts`, puros: view-model/derivações) + Vitest/jsdom (`*.spec.tsx`, componentes) + Playwright e2e (`*.e2e.ts`)
**Target Platform**: navegador (SSR + hidratação TanStack Start)
**Project Type**: web app (front + BFF unificado); esta feature é só a fatia **client**
**Performance Goals**: lista responsiva; toggles/ações com feedback imediato (otimista onde aplicável)
**Constraints**: invariantes v2 (Result, sem `class`/`throw` fora da borda, design system só-tokens, i18n, views burras MVVM, boundaries por `public-api`)
**Scale/Scope**: ~1 submódulo, 4 telas (lista, criar, editar/completar, detalhe/desativar) + import; reaproveita 8 server-fns

## Constitution Check

*GATE: deve passar antes da Fase 0 e ser reavaliado após a Fase 1.*

- **Erros como valor (Result)**: ✅ data/view-model retornam `Result`; `throw` só em `queryFn`/`mutationFn` (QueryError) — igual a ACT.
- **Sem `class`/`this`/`throw` fora da borda; sem `any`**: ✅ espelha ACT.
- **Server-state ≠ UI-state**: ✅ remoto no TanStack Query (queries/mutations), UI-state em controllers (`useReducer`/estado de form).
- **Views burras (MVVM, §XI)**: ✅ `*.page.tsx`/`*.component.tsx` sem data-hooks; ViewModel/Controller orquestram.
- **Design system só-tokens**: ✅ `*.css.ts` usam `vars.*`; proibido hex/px crus.
- **i18n**: ✅ strings de UI via `#shared/i18n` (namespace `partners.collaborator.*`), erros internos kebab-case EN.
- **Boundaries**: ✅ import cross-módulo só via `public-api`; client `ui` recebe tudo por props da ViewModel.
- **Token nunca no browser**: ✅ não aplicável diretamente; reusa server-fns que já respeitam.

**Resultado do gate**: PASS — sem violações; espelha um módulo já aprovado pelo lint (ACT).

## Project Structure

### Documentation (this feature)

```text
specs/015-collaborator-screens/
├── plan.md              # este arquivo
├── research.md          # decisões (rota, filtro de idade, import, motivo de desativação)
├── data-model.md        # entidade Colaborador (campos + situação cadastral + ativo/inativo)
├── quickstart.md        # como rodar e validar localmente
├── contracts/           # contrato client↔BFF (reuso das 8 server-fns) + UI
└── tasks.md             # (gerado pelo /speckit-tasks — NÃO neste comando)
```

### Source Code — arquivos novos mapeados ao análogo (ACT/Supplier)

> Convenção: criar `src/modules/partners/client/collaborator-*` espelhando `act-*`. Postfix por tipo.

**Data layer** (`src/modules/partners/client/data/`)
| Novo | Análogo |
|---|---|
| `model/collaborator.model.ts` | `model/act.model.ts` |
| `repository/collaborator.repository.ts` | `repository/act.repository.ts` |
| `repository/collaborator.repository.instance.ts` | `repository/act.repository.instance.ts` |

**Lista** (`client/collaborator-list/`) → rota `/parceiros/colaboradores`
| Novo | Análogo |
|---|---|
| `collaborator-list.query.ts` | `act-list/act-list.query.ts` |
| `collaborator-list.view-model.ts` (inclui derivação do **filtro de idade** a partir de `dateOfBirth`) | `act-list/act-list.view-model.ts` |
| `collaborator-list.binding.ts` | `act-list/act-list.binding.ts` |
| `page/collaborator-list.page.tsx` + `.css.ts` | `act-list/page/*` |
| `components/collaborator-filters.component.tsx` + `.controller.ts` + `.css.ts` | `act-list/components/act-filters.*` |
| `components/collaborator-paginator.component.tsx` + `.css.ts` | `act-list/components/act-paginator.*` |
| `components/import-collaborators-dialog.component.tsx` + `.controller.ts` + `.css.ts` (**novo — sem análogo direto**; usa `importCollaboratorsFn`, lê `File.text()`, mostra `{criados, falhas}`) | (padrão de `confirm-dialog` + input de arquivo) |

**Criar (pré-cadastro)** (`client/collaborator-create/`) → rota `/parceiros/colaboradores/adicionar`
| Novo | Análogo |
|---|---|
| `collaborator-create.view-model.ts` | `act-create/act-create.view-model.ts` |
| `collaborator-create.binding.ts` | `act-create/act-create.binding.ts` |
| `collaborator-create.mutation.ts` (usa `createCollaboratorFn`) | `act-create/act-create.mutation.ts` |
| `page/collaborator-create.page.tsx` + `.css.ts` | `act-create/page/*` |
| `components/collaborator-form.component.tsx` + `.controller.ts` + `.css.ts` (7 campos essenciais) | `act-create/components/act-form.*` |

**Editar / completar cadastro** (`client/collaborator-edit/`) → rota `/parceiros/colaboradores/editar/:id`
| Novo | Análogo |
|---|---|
| `collaborator-edit.view-model.ts` | `act-edit/act-edit.view-model.ts` |
| `collaborator-edit.binding.ts` | `act-edit/act-edit.binding.ts` |
| `collaborator-edit.mutation.ts` (usa `updateCollaboratorFn` **+** `completeCollaboratorRegistrationFn` → promove `Pré Cadastrado`→`Cadastrado`) | `act-edit/act-edit.mutation.ts` |
| `page/collaborator-edit.page.tsx` + `.css.ts` | `act-edit/page/*` |
| `components/collaborator-edit-form.component.tsx` (dados pessoais) | `act-edit/components/act-edit-form.component.tsx` |

**Detalhe + Desativar/Reativar** (`client/collaborator-detail/`) → rota `/parceiros/colaboradores/:id`
| Novo | Análogo |
|---|---|
| `collaborator-detail.query.ts` | `act-detail/act-detail.query.ts` |
| `collaborator-detail.view-model.ts` | `act-detail/act-detail.view-model.ts` |
| `collaborator-detail.binding.ts` | `act-detail/act-detail.binding.ts` |
| `collaborator-status.mutation.ts` (usa `deactivateCollaboratorFn` + `reactivateCollaboratorFn`) | `act-detail/act-status.mutation.ts` |
| `page/collaborator-detail.page.tsx` + `.css.ts` | `act-detail/page/*` |
| `components/collaborator-detail-content.component.tsx` + `.css.ts` | `act-detail/components/act-detail-content.*` |
| `components/deactivate-dialog.component.tsx` + `.css.ts` (**Motivo obrigatório** — `DeactivationReasonSchema`; botão desabilitado sem motivo) | `act-detail/components/confirm-dialog.*` |

**Wiring**
| Novo/alterado | Análogo / nota |
|---|---|
| `src/modules/partners/public-api/index.ts` (exportar bindings/VMs de collaborator) | já exporta act/supplier |
| `src/routes/_authenticated/parceiros/colaboradores/index.tsx` | `parceiros/atos/index.tsx` |
| `…/colaboradores/adicionar.tsx` | `parceiros/atos/criar.tsx` |
| `…/colaboradores/editar.$id.tsx` | `parceiros/atos/$id.editar.tsx` |
| `…/colaboradores/$id.tsx` | `parceiros/atos/$id.tsx` |
| `src/modules/shell/client/data/menu/shell-menu.config.ts` (+ subitem "Colaboradores", `collaborator:read`) | itens existentes de Parceiros |
| i18n catálogo `partners.collaborator.*` em `src/shared/i18n/catalog.pt-BR.ts` | namespaces de act/supplier |
| Testes espelhados em `tests/` + e2e em `e2e/` | suites de act/supplier |

**Structure Decision**: módulo vertical client em `partners/client/collaborator-*`, espelhando `act-*`.
Rotas sob `/parceiros/colaboradores` (consistente com os irmãos), **não** `/colaboradores` solto (ver research.md).

## Complexity Tracking

> Sem violações de constituição. Nada a justificar.

## Migrations Drizzle (core-api)

- **Mudanças de schema**: [x] **nenhuma** — feature frontend-only; servidor já existe.
- Demais itens: **N/A**.

## Contrato HTTP (Fase 2+)

**N/A — reuso total.** Nenhum endpoint novo/alterado. O client consome as 8 server-fns existentes
(`list/get/create/complete-registration/update/deactivate/reactivate/import` collaborators), que já
falam com o `collaboratorsHttpPlugin` do core-api. RBAC `collaborator:read`/`collaborator:write` já
aplicado no servidor; o client apenas oculta/desabilita ações conforme a permissão.

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **L** — submódulo client completo (4 telas + import), múltiplos arquivos, embora sem backend.
- **Justificativa**: volume de arquivos (espelha ACT inteiro + 2 peças novas), mas risco baixo (padrão consolidado, servidor pronto).
- **Plano de testes (TDD)**: começar pelas derivações puras do `collaborator-list.view-model` (filtro de idade a partir de `dateOfBirth`, mapeamento de situação cadastral) em `node:test`; depois componentes (Vitest) e e2e happy/sad espelhando supplier/act.
