# Implementation Plan: RBAC do menu de fornecedores

**Branch**: `develop` (feature dir `011-supplier-menu-rbac`) | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-supplier-menu-rbac/spec.md`

## Summary

Preencher o `requiredPermission: 'supplier:read'` no subitem "Fornecedores" (seção "Gestão de
Parceiros") em `src/modules/shell/client/data/menu/shell-menu.config.ts` — o "item 2 / RBAC do
menu" que a T037 da feature 010 deixou explicitamente em aberto. A infraestrutura de filtragem
(`rootViewModel.visibleMenu`) e a cadeia de permissões reais (`getCurrentUserFn → route context
_authenticated → RootPage → useRootBinding → visibleMenu`) **já existem e estão ligadas**. O
trabalho é uma mudança de **uma linha de configuração** + **teste de regressão puro** (node:test)
sobre o **MENU real** garantindo a regra de visibilidade nos três casos (com, sem, e `[]`).

## Technical Context

**Language/Version**: TypeScript strict (migração 6→7, `erasableSyntaxOnly`)

**Primary Dependencies**: React 19, TanStack Start/Router (nenhuma nova dependência)

**Storage**: N/A (sem persistência; lê `permissions[]` da identidade da sessão já existente)

**Testing**: `node:test` (puro, sem DOM) — `*.test.ts` com imports relativos. A regra vive no
núcleo agnóstico (`root.view-model.ts`) e o dado em config pura — ambos testáveis sem jsdom.

**Target Platform**: Web (front + BFF unificado TanStack Start)

**Project Type**: Web application (módulo vertical `shell`, camada client/MVVM)

**Performance Goals**: N/A — derivação síncrona pura sobre lista pequena (≤ ~10 seções)

**Constraints**: Núcleo da ViewModel sem React (lint barra `react`/`@tanstack/react-*` em
`*.view-model.ts`); fronteiras de import enforçadas por `eslint-plugin-boundaries`; views burras.

**Scale/Scope**: 1 linha de config + 1 bloco de teste de regressão. Sem novas telas/rotas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Vertical-Modular / Isolamento**: ✅ Mudança contida no módulo `shell`. O slug
  `supplier:read` é um **valor de string** (catálogo conhecido do `partners`), não um import
  cross-módulo — não cria acoplamento de código entre `shell` e `partners`. Sem violar boundaries.
- **IV. Estados ilegais irrepresentáveis**: ✅ `requiredPermission` é campo opcional já tipado;
  `visibleMenu` já trata seção-sem-subitens (estado "accordion vazio" → removido).
- **IX. Segurança por construção**: ✅ Esta é a própria materialização do RBAC de UI (FR-020 do
  partners): não expor entrada de navegação sem a permissão. Degradação simétrica (`[]` → esconde).
  ⚠️ Nota: RBAC de UI é **defesa em profundidade / UX**, não o controle de acesso real — o core-api
  continua sendo a fonte de autorização. Não é regressão de segurança; é melhoria de UX coerente.
- **XI. MVVM / Views burras / Server-State ≠ UI-State**: ✅ A regra fica no `rootViewModel`
  (puro); a view recebe `visibleMenu` já filtrado por props. Nenhum data-hook nas views.
- **VII. Imutabilidade**: ✅ `visibleMenu` não muta o `MENU` (retorna nova lista); config é `as const`.
- **X. Design System só-tokens**: N/A — mexe em dado de menu, não em estilo.

**Resultado do gate**: PASS — sem violações. Seção *Complexity Tracking* não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/011-supplier-menu-rbac/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões (slug, local da regra, tipo de teste)
├── data-model.md        # Phase 1 — modelo conceitual (MenuSection/SubItem/Permission)
├── quickstart.md        # Phase 1 — checklist de conformidade + como rodar o teste
├── checklists/
│   └── requirements.md  # Checklist de qualidade da spec (16/16 ✓)
└── tasks.md             # Phase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
src/modules/shell/client/
├── data/menu/shell-menu.config.ts          # ★ ÚNICA edição de produção: + requiredPermission no subitem Fornecedores
└── root/viewModel/root.view-model.ts        # visibleMenu — JÁ implementa a regra (sem alteração esperada)

tests/modules/shell/client/root/
└── root.view-model.test.ts                  # ★ + bloco de regressão usando o MENU real (supplier:read)
```

**Structure Decision**: Módulo vertical `shell`, camada `client`. A feature **não** cria
arquivos novos: edita a config de menu (1 linha) e estende a suíte de teste existente. A regra
de derivação (`visibleMenu`) permanece intocada — ela já cobre o comportamento; o que muda é o
**dado** (config) e a **cobertura** (teste de regressão sobre o MENU real).

## Complexity Tracking

> N/A — Constitution Check passou sem violações.

## Migrations Drizzle (core-api)

- **Mudanças de schema**: [x] nenhuma — feature 100% frontend.
- **Prefixo de isolamento correto?**: N/A
- **Outbox**: não.
- **Comando**: N/A.

## Contrato HTTP (Fase 2+)

N/A — nenhuma borda HTTP nova. As permissões já chegam pelo fluxo de sessão existente
(`GET /me` do core-api → identidade → contexto de rota). A feature apenas **consome** um campo
já disponível.

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **S** (trivial — 1 linha de config + teste de regressão).
- **Justificativa**: A lógica (`visibleMenu`) e a cadeia de permissões já existem e estão
  testadas em isolamento; o escopo é preencher um valor de config e travar com teste.
- **Plano de testes W0 (RED)**: novo bloco em `root.view-model.test.ts` importando o `MENU` real
  e asserindo: (a) `visibleMenu(MENU, ['supplier:read'])` contém a seção "Gestão de Parceiros"
  com o subitem "Fornecedores"; (b) `visibleMenu(MENU, [])` não contém nem o subitem nem a seção;
  (c) sem `supplier:read` (mas com outras permissões) também esconde. Esse teste falha **antes**
  da edição da config (porque hoje o subitem não exige permissão → aparece com `[]`).
