/**
 * SuppliersWithoutContractCard — estilos (vanilla-extract, §X: só-tokens, zero hex/px cru). Card branco com
 * título, GRÁFICO de barras de compliance (espelha o relatório "Fornecedores sem Contrato": nome + track com
 * marcador de Limite + fill colorido POR STATUS + % ao lado + tooltip HTML no hover) e botão "Ver todas" de
 * largura total. Layout COMPACTO p/ o card estreito (coluna direita ~1/3): nome flexível (ellipsis) em vez da
 * coluna fixa de 180px do relatório, barras mais finas. Cor por CLASSE (styleVariants) — a view não importa
 * tokens (§boundaries client-ui ↛ ds-tokens). `fontFamily: vars.font.family.body` evita a serifa do body.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

export const card = style({
  fontFamily: vars.font.family.body,
  background: vars.color.surface.default,
  // Borda + profundidade do card do grid de Colaboradores (brand): linha neutra + sombra em camadas.
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: vars.radius.lg,
  boxShadow: brand.shadow.card,
  padding: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

export const title = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

// ── Gráfico de barras de compliance ──
// Container ÂNCORA (position:relative) do tooltip flutuante; a posição do card vem inline (sob o cursor).
export const chartRel = style({ position: 'relative', inlineSize: '100%' })

// Uma linha por fornecedor (COMPACTA): NOME (flexível, ellipsis) | TRACK (flex) | % (auto). Diferente do
// relatório (coluna de nome fixa 180px), aqui o nome é flexível p/ caber no card estreito.
export const hbar = style({
  display: 'grid',
  gridTemplateColumns: `minmax(0, 1fr) minmax(3.5rem, 1.4fr) auto`,
  alignItems: 'center',
  gap: vars.space.sm,
  marginBlockEnd: vars.space.md,
  cursor: 'default',
  selectors: { '&:last-child': { marginBlockEnd: 0 } },
})

export const hbarName = style({
  fontSize: brand.text.thead,
  color: brand.color.ink700,
  fontWeight: brand.weight.medium,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

// Track com o marcador de 100% (Limite). Barra mais FINA que o relatório (18px) p/ o card estreito.
export const hbarTrack = style({
  position: 'relative',
  blockSize: vars.space.sm,
  background: brand.color.surfaceAlt,
  borderRadius: brand.radius.xs,
  overflow: 'hidden',
})

// Linha de referência do Limite (100%) — pontilhada vertical POSICIONADA proporcionalmente (inline
// `insetInlineStart`), pois a escala do track pode passar de 100% (estouros). Acima do fill (zIndex).
export const limitMarker = style({
  position: 'absolute',
  insetBlock: 0,
  inlineSize: 0,
  borderInlineStart: `${vars.borderWidth.thin} dashed ${brand.color.lineStrong}`,
  zIndex: 1,
  pointerEvents: 'none',
})

export const hbarFill = style({
  // display:block — sem isto o <span> fica inline e IGNORA inline-size (fill invisível).
  display: 'block',
  blockSize: '100%',
  borderRadius: brand.radius.xs,
})
export const hbarFillAnimated = style({ transition: 'inline-size .55s ease-out' })

// Cor do fill por STATUS DE COMPLIANCE (mesma tinta do relatório): estouro=danger, no-limite=neutro, dentro=primary.
export const fillStatus = styleVariants({
  over: { background: brand.color.dangerDot },
  at: { background: brand.color.atLimitFg },
  within: { background: brand.color.primary },
})

// % ao lado da barra. Danger quando estoura (casa a cor do fill).
export const hbarValue = style({
  fontSize: brand.text.chip,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})
export const valueStatus = styleVariants({
  over: { color: brand.color.dangerFg },
  at: { color: brand.color.atLimitFg },
  within: { color: brand.color.ink900 },
})

// ── Tooltip flutuante (hover) — padrão do Dashboard: card pequeno com sombra, só-tokens. ──
export const tooltip = style({
  position: 'absolute',
  transform: 'translate(-50%, -115%)',
  pointerEvents: 'none',
  zIndex: 2,
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.md,
  boxShadow: brand.shadow.cardDepth,
  padding: brand.space.sm,
  minInlineSize: '9rem',
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xs,
  fontFamily: 'inherit',
})

export const tooltipTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.xs,
  fontSize: brand.text.thead,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
})

export const tooltipSwatch = style({
  flexShrink: 0,
  inlineSize: brand.space.sm,
  blockSize: brand.space.sm,
  borderRadius: brand.radius.xs,
})

// Cor do swatch do tooltip por STATUS (casa com o fill da barra).
export const tooltipSwatchStatus = styleVariants({
  over: { background: brand.color.dangerDot },
  at: { background: brand.color.atLimitFg },
  within: { background: brand.color.primary },
})

export const tooltipRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.xs,
  fontSize: brand.text.chip,
})

export const tooltipName = style({ color: brand.color.ink700 })

export const tooltipVal = style({
  marginInlineStart: 'auto',
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
})

// Estado vazio (nenhum fornecedor para o gráfico).
export const emptyState = style({
  color: brand.color.ink500,
  fontSize: brand.text.body,
  textAlign: 'center',
  paddingBlock: brand.space.xl,
})

export const seeAllButton = style({
  inlineSize: '100%',
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.subtle,
  color: vars.color.brand.normal,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      background: vars.color.nav.surfaceHover,
    },
  },
})
