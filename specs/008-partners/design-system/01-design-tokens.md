# 01 · Design Tokens: Gestão de Parceiros

**Feature**: `specs/008-partners/design-system/` · **Base**: ADR-0007 (vanilla-extract), `shared/ui/tokens`

> `ui/` não usa hex/rgb/px crus — só `vars.*`. Este doc mapeia os tokens da feature e sinaliza lacunas.
> Os valores crus abaixo são os **observados na evidência** (a serem casados com tokens existentes; criar
> token novo é exceção).

## 1. Tokens existentes reutilizados (casar com `shared/ui/tokens`)

| Papel | `vars.*` (alvo) | Uso na feature |
|---|---|---|
| Marca (sidebar/header) | `vars.color.brand.primary` | AppShell |
| Realce / CTA | `vars.color.accent` | botões primários, item ativo |
| Fundo de página | `vars.color.surface.muted` | background |
| Fundo de card | `vars.color.surface.base` | FormCard, tabela |
| Texto primário/secundário | `vars.color.text.primary` / `.secondary` | conteúdo |
| Espaçamento / raio / sombra | `vars.space.*` / `vars.radius.*` / `vars.shadow.*` | cards, grids |
| Tipografia | `vars.font.*` | títulos de seção, labels |

## 2. Mapa semântico (evidência → token)

| Papel visual (evidência) | Valor cru observado | Token canônico (alvo) |
|---|---|---|
| Marca / sidebar | `#2E3A59` (azul marinho) | `vars.color.brand.primary` |
| CTA / item ativo | `#00BCD4` (ciano) | `vars.color.accent` |
| Fundo de página | `#F0F2F5` | `vars.color.surface.muted` |
| Card | `#FFFFFF` + sombra `0 2px 8px rgba(0,0,0,.08)` | `vars.color.surface.base` + `vars.shadow.card` |
| Texto primário | `#1A1A2E` | `vars.color.text.primary` |
| Texto secundário | `#9E9E9E` | `vars.color.text.secondary` |
| Status Ativo | borda verde | `vars.color.status.active` |
| Status Inativo | `#757575` sólido | `vars.color.status.inactive` |
| Alerta (sem contrato) | `#EF9A9A` (salmão) | `vars.color.status.warning` |
| Sucesso/positivo | `#4CAF50` | `vars.color.status.success` |
| Raio de card | ~12px | `vars.radius.lg` |

## 3. Lacunas / riscos

- Confirmar se já existem tokens para `status.{active,inactive,warning,success}` em `shared/ui/tokens`;
  se não, propor adição em `*.values.ts` (não inventar cor solta na tela).
- O ciano de destaque (`#00BCD4`) deve mapear ao `accent` existente — validar contraste AA sobre branco.
- Sombra de card e raio: confirmar tokens equivalentes.

## 4. Regra (lint)

Proibido literal cru em `modules/partners/client/ui` e nos átomos/moléculas/organismos. Fonte de verdade
dos literais: `tokens/` + `*.values.ts`.
