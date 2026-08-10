/**
 * Estilos do gráfico "Utilização do limite por fornecedor" (relatório "Fornecedores sem Contrato").
 * Barras horizontais no MESMO padrão visual do "Realizado × Planejado" (nome à direita + track + fill +
 * valor), com a cor do fill DIRIGIDA PELO STATUS DE COMPLIANCE (mesma lógica da tabela): estouro = danger
 * (vermelho), no-limite = neutro (cinza atLimit), dentro = primary (azul). Cor por CLASSE (styleVariants) —
 * as views não importam tokens (§boundaries client-ui ↛ ds-tokens). Só-tokens §X (hex/px só no `*.values.ts`).
 *
 * Marcador de 100% (a linha do Limite) no track dá o "acima × abaixo" à primeira leitura. Animação de
 * entrada discreta: o fill cresce em `inline-size` quando `animate` vira true (CSS transition, SSR-safe).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// ── Tooltip flutuante (hover) — padrão do Dashboard: card pequeno com sombra, só-tokens. ──
// Âncora relativa: o container do gráfico ganha position:relative (chartRel); a posição vem inline.
export const chartRel = style({ position: 'relative', inlineSize: '100%' })

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

// Uma linha por fornecedor: NOME (à direita, ellipsis) | TRACK (flex) | VALOR/% (auto).
export const hbar = style({
  display: 'grid',
  gridTemplateColumns: `${brand.rxp.hbarNameCol} 1fr auto`,
  alignItems: 'center',
  gap: brand.space.sm,
  marginBlockEnd: brand.space.md,
  cursor: 'default',
  selectors: { '&:last-child': { marginBlockEnd: 0 } },
})

export const hbarName = style({
  fontSize: brand.text.thead,
  color: brand.color.ink700,
  fontWeight: brand.weight.medium,
  textAlign: 'end',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

// Track com o marcador de 100% (Limite): borda pontilhada vertical no fim da faixa.
export const hbarTrack = style({
  position: 'relative',
  blockSize: brand.rxp.hbarHeight,
  background: brand.color.surfaceAlt,
  borderRadius: brand.radius.xs,
  overflow: 'hidden',
})

// Linha de referência do Limite (100%) — pontilhada vertical POSICIONADA proporcionalmente (inline style
// `insetInlineStart`), pois a escala do track pode passar de 100% (estouros). Fica acima do fill (zIndex).
export const limitMarker = style({
  position: 'absolute',
  insetBlock: 0,
  inlineSize: 0,
  borderInlineStart: `${vars.borderWidth.thin} dashed ${brand.color.lineStrong}`,
  zIndex: 1,
  pointerEvents: 'none',
})

export const hbarFill = style({
  // display:block — sem isto o <span> fica inline e IGNORA inline-size/block-size (fill invisível).
  display: 'block',
  blockSize: '100%',
  borderRadius: brand.radius.xs,
})
export const hbarFillAnimated = style({ transition: 'inline-size .55s ease-out' })

// Cor do fill por STATUS DE COMPLIANCE (mesma lógica/tinta da tabela): aplicada por CLASSE.
export const fillStatus = styleVariants({
  over: { background: brand.color.dangerDot },
  at: { background: brand.color.atLimitFg },
  within: { background: brand.color.primary },
})

// Valor/percentual ao lado da barra. Danger quando estoura (casa a cor do fill).
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

// Estado vazio (nenhum fornecedor para o gráfico).
export const emptyState = style({
  color: brand.color.ink500,
  fontSize: brand.text.body,
  textAlign: 'center',
  paddingBlock: brand.space.xxl,
})
