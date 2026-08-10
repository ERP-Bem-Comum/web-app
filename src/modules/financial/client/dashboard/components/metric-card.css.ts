/**
 * MetricCard — estilos (vanilla-extract, §X: só-tokens, zero hex/px cru). Card branco em UMA linha:
 * bloco de infos à esquerda (rótulo · valor · tendência, bem compactos) e ícone circular VERTICALMENTE
 * CENTRADO à direita. O círculo do ícone herda a cor de acento via `currentColor` (setada por token na
 * view) e usa um fundo translúcido dela. `fontFamily: vars.font.family.body` evita a serifa (Times).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Accent do ÍCONE → círculo com DEGRADÊ suave da cor do acento + glyph BRANCO (currentColor=onBrand).
// Classe (a view não importa tokens — §boundaries). O degradê (mistura com `white` via color-mix, sem hex
// cru) dessatura um pouco a cor forte → menos "conflitante", visual mais sofisticado.
const softChip = (c: string): string =>
  `linear-gradient(135deg, color-mix(in srgb, ${c} 60%, white), color-mix(in srgb, ${c} 90%, white))`

export const iconAccent = styleVariants({
  red: { background: softChip(vars.color.feedback.errorText), color: vars.color.brand.onBrand },
  green: { background: softChip(vars.color.status.activeText), color: vars.color.brand.onBrand },
  indigo: { background: softChip(vars.color.nav.background), color: vars.color.brand.onBrand },
  orange: { background: softChip(vars.color.institutional.orange), color: vars.color.brand.onBrand },
})

// Barra vertical de acento à ESQUERDA do card (padrão dos KPIs do Realizado × Planejado) — cor SÓLIDA do
// acento, casando com o ícone. Só a cor da barra (`&::before`) muda por acento; a geometria vem do `card`.
export const barAccent = styleVariants({
  red: { selectors: { '&::before': { background: vars.color.feedback.errorText } } },
  green: { selectors: { '&::before': { background: vars.color.status.activeText } } },
  indigo: { selectors: { '&::before': { background: vars.color.nav.background } } },
  orange: { selectors: { '&::before': { background: vars.color.institutional.orange } } },
})

// Card em linha: infos à esquerda, ícone centrado na vertical à direita (space-between + align center).
export const card = style({
  position: 'relative',
  overflow: 'hidden', // clipa a barra de acento aos cantos arredondados
  fontFamily: vars.font.family.body,
  background: vars.color.surface.default,
  // Borda + profundidade do card do grid de Colaboradores (brand): linha neutra + sombra em camadas.
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: vars.radius.lg,
  boxShadow: brand.shadow.card,
  padding: vars.space.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  // Barra vertical de acento à esquerda (4px = space.xs) — a COR vem por `barAccent` (styleVariant).
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      insetInlineStart: 0,
      insetBlockStart: 0,
      insetBlockEnd: 0,
      inlineSize: vars.space.xs,
    },
  },
})

// Bloco de infos (rótulo · valor · tendência) — empilhado e BEM compacto. Gap mínimo (xs) + line-height
// justo (1.15) p/ colar rótulo→valor→tendência, como no print-alvo.
export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: 0,
})

export const label = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.muted,
  lineHeight: 1.15,
  margin: 0,
})

export const value = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  lineHeight: 1.1,
  margin: 0,
})

// Círculo SÓLIDO do ícone (bg/glyph vêm de `iconAccent`). Tamanho ~3rem (xl+md, sem px cru); `borderRadius:50%`
// = círculo perfeito (não quadrado arredondado).
export const iconCircle = style({
  flexShrink: 0,
  inlineSize: `calc(${vars.space.xl} + ${vars.space.md})`,
  blockSize: `calc(${vars.space.xl} + ${vars.space.md})`,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const trendRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  fontSize: vars.font.size.sm,
  lineHeight: 1.1,
  margin: 0,
})

// Seta + percentual da tendência = VERDE (positivo), como no legado — independe do acento do card.
export const trendArrow = style({
  display: 'inline-flex',
  alignItems: 'center',
  color: vars.color.status.activeText,
})

export const trendPercent = style({
  fontWeight: vars.font.weight.semibold,
  color: vars.color.status.activeText,
})

export const trendLabel = style({
  color: vars.color.text.muted,
  marginInlineStart: vars.space.xs,
})
