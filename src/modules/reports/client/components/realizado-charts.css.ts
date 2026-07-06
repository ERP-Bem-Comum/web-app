/**
 * Estilos dos 3 gráficos do relatório "Realizado × Planejado" (reprodução do mock): barras horizontais
 * "Por centro de custo", linha+área "Distribuição mensal" (SVG) e donut "Realizado vs previsto". Identidade
 * "brand", só-tokens (§X). As cores das medidas vêm de `brand.color.rxp.*` (hex cru só no `*.values.ts`) e
 * são aplicadas por CLASSE (styleVariants) — as views não importam tokens (§boundaries client-ui ↛ ds-tokens).
 *
 * Animação de entrada discreta (pedido da P.O.): barras crescem em `inline-size`, arcos do donut via
 * `stroke-dashoffset`, a linha "desenha" via `stroke-dashoffset`. Todas ~450-600ms ease-out (CSS transition,
 * SSR-safe: o 1º paint tem o estado "vazio" e o efeito de mount dispara a transição no cliente).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// ── Barras horizontais "Por centro de custo" ──
export const hbar = style({
  display: 'grid',
  gridTemplateColumns: `${brand.rxp.hbarNameCol} 1fr auto`,
  alignItems: 'center',
  gap: brand.space.sm,
  marginBlockEnd: brand.space.md,
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
export const hbarTrack = style({
  blockSize: brand.rxp.hbarHeight,
  background: brand.color.surfaceAlt,
  borderRadius: brand.radius.xs,
  overflow: 'hidden',
})
export const hbarFill = style({
  blockSize: '100%',
  background: brand.color.rxp.previsto,
  borderRadius: brand.radius.xs,
})
export const hbarFillAnimated = style({ transition: 'inline-size .55s ease-out' })
export const hbarValue = style({
  fontSize: brand.text.chip,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

// ── Gráfico de linha "Distribuição mensal" (SVG) ──
export const lineSvg = style({ display: 'block', inlineSize: '100%', blockSize: 'auto' })
export const gridLine = style({
  stroke: brand.color.line2,
  strokeWidth: vars.borderWidth.thin,
  strokeDasharray: '3 6',
})
export const axisText = style({
  fill: brand.color.ink400,
  fontSize: brand.rxp.svgAxisFont,
  fontFamily: 'inherit',
})
export const monthText = style({
  fill: brand.color.ink500,
  fontSize: brand.rxp.svgAxisFont,
  fontFamily: 'inherit',
})
export const lineArea = style({ fill: 'url(#rxpLineFill)' })
// Paradas do gradiente da área (topo 18% → base 0%), na cor "previsto". stopColor por token (sem hex na view).
export const areaStopTop = style({ stopColor: brand.color.rxp.previsto, stopOpacity: 0.18 })
export const areaStopBottom = style({ stopColor: brand.color.rxp.previsto, stopOpacity: 0 })
export const linePath = style({
  fill: 'none',
  stroke: brand.color.rxp.previsto,
  strokeWidth: brand.rxp.lineStroke,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})
// Ao animar, a linha "desenha" (dashoffset → 0).
export const linePathAnimated = style({ transition: 'stroke-dashoffset .7s ease-out' })
export const areaAnimated = style({ transition: 'opacity .6s ease-out' })

// ── Donut "Realizado vs previsto" ──
export const donutWrap = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: brand.space.md,
})
export const donut = style({ position: 'relative', inlineSize: '7.5rem', blockSize: '7.5rem' })
export const donutSvg = style({ display: 'block', inlineSize: '100%', blockSize: '100%' })
export const donutCenter = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
})
export const donutBig = style({
  fontSize: '1.25rem',
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
})
export const donutCap = style({
  fontSize: brand.rxp.svgAxisFont,
  color: brand.color.ink500,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
})
export const arcAnimated = style({ transition: 'stroke-dashoffset .55s ease-out' })

// Cor por medida (arco do donut, preenchimento da barra, ponto da legenda) — aplicada por CLASSE.
export const measureStroke = styleVariants({
  realizado: { stroke: brand.color.rxp.realizado },
  provisionado: { stroke: brand.color.rxp.provisionado },
  previsto: { stroke: brand.color.rxp.previsto },
})
export const measureDot = styleVariants({
  realizado: { background: brand.color.rxp.realizado },
  provisionado: { background: brand.color.rxp.provisionado },
  previsto: { background: brand.color.rxp.previsto },
})

// ── Legenda do donut ──
export const legend = style({ inlineSize: '100%', listStyle: 'none', margin: 0, padding: 0 })
export const legendItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  paddingBlock: brand.space.xs,
  fontSize: brand.text.label,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  selectors: { '&:last-child': { borderBlockEnd: 'none' } },
})
export const legendDot = style({
  inlineSize: '0.5625rem',
  blockSize: '0.5625rem',
  borderRadius: brand.radius.xs,
  flexShrink: 0,
})
export const legendName = style({ color: brand.color.ink700, fontWeight: brand.weight.medium })
export const legendValue = style({
  marginInlineStart: 'auto',
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
})

// Estado vazio (nenhum dado para o gráfico).
export const emptyState = style({
  color: brand.color.ink500,
  fontSize: brand.text.body,
  textAlign: 'center',
  paddingBlock: brand.space.xxl,
})
