# Implementation Plan: Telas de Fornecedores (Suppliers)

**Branch**: `010-supplier-screens` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-supplier-screens/spec.md`

## Summary

Construir o **primeiro vertical de UI** do módulo de parceiros: as 4 telas de **Fornecedores** (listar, criar, editar, detalhar), em `src/modules/partners/client/`, **espelhando `contracts/client`** (MVVM com núcleo agnóstico: `data → repository → view-model → binding → ui`) e **consumindo** (a) os 6 server-fns + categorias já prontos em `partners/public-api`, (b) os organismos `DataTable`/`PageHeader` de `#shared/ui`, (c) o helper `can()` de RBAC já existente. Rotas sob `/_authenticated/parceiros/fornecedores`. i18n no namespace `partners.suppliers.*`. Erros como valores → tag i18n via `switch` exaustivo. Nenhuma mudança no backend.

## Technical Context

**Language/Version**: TypeScript strict (6→7), React 19, ESM.

**Primary Dependencies**: TanStack Router (rotas file-based + `validateSearch`), TanStack Query (server-state), Zod 4 (validação na borda do cliente — form + search), `#shared/ui` (organismos + atoms/molecules), `#modules/partners/public-api` (server fns + tipos).

**Storage**: N/A (frontend; estado remoto no TanStack Query).

**Testing**: `node:test` para lógica pura (view-model, mappers, error-tag, can); Vitest + jsdom para DOM (form controller, páginas burras); Playwright opcional para visual (pode entrar em polish).

**Target Platform**: Browser (app autenticado, atrás do BFF).

**Project Type**: Web app (frontend) — vertical de feature dentro de `modules/partners`.

**Performance Goals**: Listagem paginada (limit default 5, máx 100); busca/filtros refletidos na URL; sem N+1 no client (o BFF entrega a página pronta).

**Constraints** (constituição §I–§XII): views burras (§XI), núcleo client agnóstico de framework (§XI), server-state ≠ UI-state (§XI), server fn única fronteira (§III), erros como valores + switch exaustivo → i18n (§II/§V), validação na fronteira com Zod (§IX), só-tokens no CSS (§X), strings via i18n (§X), `client/data` só alcança `server-adapters` (§I boundaries).

**Scale/Scope**: 1 entidade (Supplier), 4 telas, client + data + domain + rotas + i18n. Molde replicável para financiadores/geografia/ACTs (fora de escopo).

## Constitution Check

> Constituição do web-app (§I–§XII) em `.specify/memory/constitution.md`. Esta feature replica o padrão `contracts` (feature-modelo) — alinhamento alto por construção.

| Princípio | Aplica | Como o plano cumpre |
|---|---|---|
| §I Vertical-modular | ✅ | Tudo em `modules/partners/client/`; consumo externo só via `partners/public-api` e `#shared/ui`. |
| §II Erros como valores | ✅ | Repository devolve `Result`; `supplier-error-tag` mapeia por `switch` exaustivo → tag i18n. |
| §III Server fn única fronteira | ✅ | `client/data/repository` chama as server fns; client nunca toca `server/domain\|application` nem core-api. |
| §IV Illegal states | ✅ | Estado de página/form como união discriminada; `activation` é `'active'\|'inactive'`. |
| §V Cadeia de erro | ✅ | UI trata só `AppError.kind` → i18n; nunca status HTTP. 401 cai na cadeia global. |
| §VI TS estrito 6→7 | ✅ | Sem `any`/`enum`; `Readonly`; tipos fluem das server fns + schemas Zod do client. |
| §VII Imutabilidade | ✅ | Models `Readonly`; estado de UI via reducer tagged. |
| §IX Segurança/RBAC | ✅ | `can()` governa ações; bancário/PIX sob `supplier:edit-sensitive`. Zod na borda do cliente (form + search). |
| §X Design system | ✅ | Listagem usa `DataTable`/`PageHeader`; CSS local só-tokens; strings via `partners.suppliers.*`. |
| §XI MVVM/views burras | ✅ | `*.page.tsx`/`*.component.tsx` burras; `*.view-model.ts` puro (sem React); `*.binding.ts` adapta TanStack Query; `*.controller.ts` no form. |
| §XII Eventos de domínio | N/A | Invalidação via Query cache, não Event Bus. |

**Resultado do gate**: PASS — sem violações. Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/010-supplier-screens/
├── plan.md · research.md · data-model.md · quickstart.md
├── contracts/  (supplier-list.contract.md, supplier-form.contract.md, supplier-detail.contract.md)
├── checklists/requirements.md
└── tasks.md  (/speckit-tasks)
```

### Source Code (repository root)

```text
src/modules/partners/client/
├── data/
│   ├── model/supplier.model.ts            # Zod do response (parse defensivo do BFF) + tipos
│   ├── repository/supplier.repository.ts  # interface + factory (Result), porta → server fns
│   ├── repository/supplier.repository.instance.ts  # wire das 7 server fns reais
│   ├── helpers/can.ts                      # (EXISTE) RBAC supplier:*/...
│   └── helpers/supplier-error-tag.ts       # AppError → tag i18n (switch exaustivo)
├── domain/
│   ├── supplier.schemas.ts                 # Zod: filtros (search params) + input do form
│   └── supplier.types.ts                   # tipos derivados (filtros, form values, row)
├── supplier-list/
│   ├── supplier-list.query.ts · .view-model.ts · .binding.ts
│   ├── page/supplier-list.page.tsx         # PageHeader + filtros + DataTable + paginador
│   └── components/                         # filtros, paginador, ações de linha (locais)
├── supplier-create/
│   ├── supplier-create.mutation.ts · .view-model.ts · .binding.ts
│   ├── page/supplier-create.page.tsx
│   └── components/supplier-form.component.tsx · supplier-form.controller.ts
├── supplier-edit/
│   ├── supplier-edit.query.ts · .mutation.ts · .view-model.ts · .binding.ts
│   └── page/supplier-edit.page.tsx        # reusa supplier-form
└── supplier-detail/
    ├── supplier-detail.query.ts · .view-model.ts · .binding.ts
    ├── supplier-status.mutation.ts         # deactivate/reactivate
    └── page/supplier-detail.page.tsx + components/ (hero/aside + confirm-status local)

src/routes/_authenticated/parceiros/fornecedores/
├── index.tsx          # /parceiros/fornecedores  (validateSearch = filtros Zod)
├── criar.tsx          # /parceiros/fornecedores/criar
├── $id.tsx            # /parceiros/fornecedores/$id  (detalhe)
└── $id.editar.tsx     # /parceiros/fornecedores/$id/editar

src/shared/i18n/catalog.pt-BR.ts   # + namespace partners.suppliers.*
tests/modules/partners/client/...  # espelha src/ (view-model, mappers, error-tag, form controller, can)
```

**Structure Decision**: Espelha `contracts/client` 1:1 (a feature-modelo), trocando "contract" por "supplier" e agrupando rotas sob `parceiros/`. A camada é o **sufixo do arquivo** (§XI), não a pasta. `data/helpers/can.ts` já existe e é reusado.

## Complexity Tracking

> Constitution Check passou — seção vazia.

## Migrations Drizzle (core-api)

- **Mudanças de schema**: [x] **nenhuma** — backend de supplier já pronto; feature 100% frontend.

## Contrato HTTP (Fase 2+)

N/A — consumo das server fns existentes (BFF). Nenhum endpoint novo.

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **L** — 4 telas, data layer (model/repository/error-tag), domain (schemas/types), 4 conjuntos view-model/binding/page, form com grupos condicionais (bancário/PIX), rotas e i18n.
- **Plano de testes (TDD, RED primeiro)** — suites puras antes da UI:
  - `supplier-error-tag.test.ts` (cada `AppError.kind` → tag; exaustivo).
  - `supplier-list.view-model.test.ts` (model→row; estado loading/empty/error/ready).
  - `supplier.schemas.test.ts` (filtros + form: e-mail/CNPJ com-e-sem-máscara, grupo bancário "tudo ou nada", obrigatórios).
  - `supplier-form.controller.spec.tsx` (Vitest): bloqueia submit inválido; emite input válido.
