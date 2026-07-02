/**
 * LineChart — estilos (vanilla-extract, §X: só-tokens, zero hex/px cru). O SVG é responsivo (100% de
 * largura, altura por aspect-ratio). Rótulos dos eixos usam tamanho de fonte por token; as cores de
 * traço/preenchimento do SVG vêm de tokens setados na view (não aqui). Legenda em linha.
 */
import { style, styleVariants, keyframes } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Animação de entrada: a linha se "desenha" (stroke-dashoffset 1→0, com pathLength=1 normalizado no SVG).
const drawLine = keyframes({
  from: { strokeDashoffset: 1 },
  to: { strokeDashoffset: 0 },
})

// O gráfico entra escalando MUITO de leve (reduz p/ o tamanho final) + fade discreto — toque sutil.
const chartIn = keyframes({
  from: { opacity: 0.6, transform: 'scale(1.015)' },
  to: { opacity: 1, transform: 'scale(1)' },
})

// Papel da série → cor de token, aplicada como CLASSE (a view não importa tokens — §boundaries).
// `stroke`/`fill` do SVG resolvem pela classe; a legenda usa `background`.
export const seriesStroke = styleVariants({
  forecast: { stroke: vars.color.chart.forecast },
  realized: { stroke: vars.color.chart.realized },
})

export const seriesSwatchColor = styleVariants({
  forecast: { background: vars.color.chart.forecast },
  realized: { background: vars.color.chart.realized },
})

// Dot (preenchido) da série no mês sob o cursor.
export const seriesDotFill = styleVariants({
  forecast: { fill: vars.color.chart.forecast },
  realized: { fill: vars.color.chart.realized },
})

// Linha da série com animação de "desenho" na entrada (pathLength=1 no SVG → dash normalizado).
export const seriesPath = style({
  strokeDasharray: 1,
  animationName: drawLine,
  animationDuration: '850ms',
  animationTimingFunction: 'ease-out',
  animationFillMode: 'both',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      strokeDasharray: 'none',
      animationName: 'none',
    },
  },
})

// 2ª série (Realizado) entra logo após a 1ª (Previsto) — stagger leve.
export const seriesPathDelayed = style([seriesPath, { animationDelay: '140ms' }])

// Cores fixas de grid/eixo (gridlines pontilhadas e rótulos), como classes só-token.
export const gridLine = style({ stroke: vars.color.chart.grid })
export const axisText = style({ fill: vars.color.chart.axis })
// Linhas dos eixos X e Y (o "L" do gráfico) — suaves: a cor do eixo clareada (mix c/ white), sutil.
export const axisLine = style({
  stroke: `color-mix(in srgb, ${vars.color.chart.axis} 42%, white)`,
})

export const wrap = style({
  fontFamily: vars.font.family.body,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

// Área do gráfico (relativa) — âncora do tooltip HTML sobreposto ao SVG.
export const chartArea = style({
  position: 'relative',
  inlineSize: '100%',
})

export const svgEl = style({
  inlineSize: '100%',
  blockSize: 'auto',
  // Mais largo que alto (achatado) p/ densidade de dashboard — evita o card do gráfico ficar alto demais.
  aspectRatio: '5 / 2',
  display: 'block',
  transformOrigin: 'center',
  animationName: chartIn,
  animationDuration: '450ms',
  animationTimingFunction: 'ease-out',
  animationFillMode: 'both',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animationName: 'none',
    },
  },
})

// Tooltip flutuante (mês + valor por série) — posição (left/top %) vem inline (data-driven).
export const tooltip = style({
  position: 'absolute',
  transform: 'translate(-50%, -115%)',
  pointerEvents: 'none',
  zIndex: 1,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.cardElevated,
  padding: vars.space.sm,
  minInlineSize: '10rem',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const tooltipMonth = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const tooltipRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  fontSize: vars.font.size.xs,
})

export const tooltipSwatch = style({
  flexShrink: 0,
  inlineSize: vars.space.sm,
  blockSize: vars.space.sm,
  borderRadius: vars.radius.sm,
})

export const tooltipName = style({
  color: vars.color.text.secondary,
})

export const tooltipVal = style({
  marginInlineStart: 'auto',
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  fontVariantNumeric: 'tabular-nums',
})

// Rótulos SVG: tamanho tipográfico + fill do eixo (axisText).
export const yLabel = style([
  axisText,
  {
    fontSize: vars.font.size['2xs'],
    fontFamily: vars.font.family.body,
  },
])

export const monthLabel = style([
  axisText,
  {
    fontSize: vars.font.size['2xs'],
    fontFamily: vars.font.family.body,
  },
])
