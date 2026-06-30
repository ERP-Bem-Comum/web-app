# 07 · Governance & Maintenance: Gestão de Parceiros

**Feature**: `specs/008-partners/design-system/` · **Base**: Atomic Design Cap. 5 + ADR-0007

> O design system é produto vivo. Define como os componentes desta feature são mantidos, versionados e
> promovidos de local (`partners/client/ui`) para global (`shared/ui`).

## 1. Makers vs. Users

- **Makers** (mantêm `shared/ui`): time de arquitetura/design system — donos da API dos átomos/moléculas/organismos globais.
- **Users** (consomem): a feature `partners` usa via `#shared/ui/*`; **não** forka estilo (só-tokens, lint cobra).

## 2. Local vs. Global (promoção)

| Componente | Hoje | Critério para promover a `shared/ui` |
|---|---|---|
| `DataTable` | candidato global | usado por contracts + partners → promover |
| `FilterPanel` | local `partners` | se 2º módulo precisar → promover |
| `FormCard` (n seções) | candidato global | já útil a contracts → avaliar |
| `DualPanel` | local `partners` | específico territorial; promover se reusado |
| `DeactivateModal` | genérico → global | parametrizar Motivo opcional |
| `AppShell`/`Sidebar` | global (reuso) | apenas adicionar itens de menu |

## 3. Regras de evolução (lint enforça)

- Só-tokens (sem hex/px cru em `ui/`); hierarquia Atomic (`tokens ← atoms ← molecules ← organisms`).
- Views burras (sem `useQuery`/`useMutation`/`useReducer`); nomear pelo papel (`...Form`/`...Card`, nunca `...View`).
- Mudança de API de componente global → revisar todos os consumidores (contracts, partners).

## 4. Versionamento & changelog

- Mudança estrutural de componente compartilhado → ADR (em `handbook/adr/` se transversal).
- Mudança cosmética → nota no PR.
- Depreciação: marcar, manter compat numa janela, remover combinado.

## 5. Acessibilidade & qualidade (gate)

`pnpm lint` (boundaries + so-tokens + MVVM) · `pnpm typecheck` · `pnpm test:all` (node:test + Vitest) ·
checagem a11y (teclado, foco, aria-live em modais/dual-panel, contraste AA).

## 6. Rastreabilidade

Inventory (00) → tokens (01) → atoms (02) → molecules (03) → organisms (04) → templates (05) → pages (06).
Cada componente cita a evidência de origem; cada decisão de fidelidade remete ao ADR-0001.
