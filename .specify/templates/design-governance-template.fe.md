# 07 · Governance & Maintenance: [FEATURE]

**Feature**: `specs/[###-feature-name]/design-system/` · **Base**: Atomic Design Cap. 5 + ADR-0007

> O design system é **produto vivo**, não artefato (Nathan Curtis). Este doc define como os
> átomos/moléculas/organismos desta feature são mantidos, versionados e promovidos para o design system
> global (`shared/ui`) vs. mantidos locais no módulo.

## 1. Makers vs. Users

- **Makers** (mantêm `shared/ui`): [quem decide a API dos componentes globais].
- **Users** (consomem no módulo): [a feature usa via `#shared/ui/*`; não fork de estilo].

## 2. Local vs. Global (promoção)

| Componente | Hoje | Critério para promover a `shared/ui` |
|---|---|---|
| [`DualPanel`] | [local em `partners/client/ui`] | [usado por ≥2 módulos → promover] |

## 3. Regras de evolução (lint enforça)

- Só-tokens (sem hex/px cru em `ui/`); hierarquia Atomic (`tokens ← atoms ← molecules ← organisms`).
- Views burras (sem data-hook/`useReducer`); nomear por papel (não `...View`).
- Mudança de API de componente global = revisão dos consumidores.

## 4. Versionamento & changelog

- [Como registrar mudança de componente (ADR se estrutural; nota no PR se cosmético).]
- [Depreciação: marcar, manter compat, remover em janela combinada.]

## 5. Acessibilidade & qualidade (gate)

- `pnpm lint` (boundaries + so-tokens + MVVM) · `pnpm typecheck` · testes (node:test + Vitest) · a11y.
