/**
 * Estilos dos gráficos do relatório "Equipe ABC" — donut "por Gênero", barras VERTICAIS "por Raça/Cor" (novo),
 * barras horizontais "por Idade/Função" e linha "por Ano". Identidade "brand", só-tokens (§X). As cores vêm de
 * `brand.color.equipe.*` (hex cru só no `*.values.ts`) e são aplicadas por CLASSE (styleVariants) — as views
 * não importam tokens (§boundaries client-ui ↛ ds-tokens).
 *
 * Reaproveita os utilitários compartilhados de tooltip/hover/hbar/linha de `realizado-charts.css.ts` (re-export
 * abaixo) para manter a identidade EXATA do relatório Realizado × Planejado. O que é específico da Equipe
 * (cores por categoria + a geometria das barras verticais) fica aqui.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Reusa a base (tooltip flutuante, âncora relativa, hbar, linha SVG, legenda, empty-state) do relatório
// Realizado × Planejado — mesma identidade visual, zero duplicação.
export {
  chartRel,
  tooltip,
  tooltipTitle,
  tooltipRow,
  tooltipName,
  tooltipVal,
  hbar,
  hbarName,
  hbarTrack,
  lineSvg,
  gridLine,
  axisText,
  linePathAnimated,
  areaAnimated,
  hoverGuide,
  hoverZone,
  donutWrap,
  donut,
  donutSvg,
  donutCenter,
  donutBig,
  donutCap,
  arcAnimated,
  legend,
  legendItem,
  legendDot,
  legendName,
  legendValue,
  emptyState,
} from './realizado-charts.css.ts'

// ── Barras horizontais (Idade / Função) — fill na cor única da marca (sem semântica de concentração) ──
export const hbarFillEquipe = style({
  display: 'block',
  blockSize: '100%',
  borderRadius: brand.radius.xs,
})
export const hbarFillAnimatedEquipe = style({ transition: 'inline-size .55s ease-out' })

// Variantes de cor do fill: `primary` (Idade) = azul da marca; `alt` (Função) = verde-azulado. A view
// escolhe por CLASSE (não importa tokens) — distingue visualmente os dois gráficos de barras horizontais.
export const hbarFillEquipeTone = styleVariants({
  primary: { background: brand.color.equipe.bar },
  alt: { background: brand.color.equipe.bar2 },
})

// ── Barras VERTICAIS "por Raça/Cor" (novo) ──
export const vbars = style({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-around',
  gap: brand.space.sm,
  blockSize: '11rem',
  paddingBlockStart: brand.space.md,
})
export const vbarCol = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: brand.space.xs,
  flex: 1,
  minInlineSize: 0,
  blockSize: '100%',
  cursor: 'default',
})
// Contagem acima da barra.
export const vbarCount = style({
  fontSize: brand.text.chip,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
})
export const vbarTrack = style({
  inlineSize: '100%',
  flex: 1,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
})
export const vbarFill = style({
  inlineSize: '72%',
  maxInlineSize: '2.75rem',
  borderStartStartRadius: brand.radius.xs,
  borderStartEndRadius: brand.radius.xs,
  transition: 'block-size .55s ease-out',
})
// Rótulo da categoria (abaixo da barra) — quebra em 2 linhas se preciso, sem estourar.
export const vbarLabel = style({
  fontSize: brand.text.thead,
  color: brand.color.ink500,
  fontWeight: brand.weight.medium,
  textAlign: 'center',
  lineHeight: 1.2,
  inlineSize: '100%',
  overflowWrap: 'anywhere',
})

// Cor da barra vertical POR categoria de raça/cor — aplicada por classe (styleVariants). A chave é o índice
// da ordem canônica (0..5) para casar com `RACA_ORDER` da ViewModel.
export const racaFill = styleVariants({
  '0': { background: brand.color.equipe.raca1 },
  '1': { background: brand.color.equipe.raca2 },
  '2': { background: brand.color.equipe.raca3 },
  '3': { background: brand.color.equipe.raca4 },
  '4': { background: brand.color.equipe.raca5 },
  '5': { background: brand.color.equipe.raca6 },
})
export const racaSwatch = styleVariants({
  '0': { background: brand.color.equipe.raca1 },
  '1': { background: brand.color.equipe.raca2 },
  '2': { background: brand.color.equipe.raca3 },
  '3': { background: brand.color.equipe.raca4 },
  '4': { background: brand.color.equipe.raca5 },
  '5': { background: brand.color.equipe.raca6 },
})

// Cor do arco/ponto do donut POR fatia de gênero (0..2) — aplicada por classe.
export const generoStroke = styleVariants({
  '0': { stroke: brand.color.equipe.gen1 },
  '1': { stroke: brand.color.equipe.gen2 },
  '2': { stroke: brand.color.equipe.gen3 },
})
export const generoDot = styleVariants({
  '0': { background: brand.color.equipe.gen1 },
  '1': { background: brand.color.equipe.gen2 },
  '2': { background: brand.color.equipe.gen3 },
})
export const generoSwatch = styleVariants({
  '0': { background: brand.color.equipe.gen1 },
  '1': { background: brand.color.equipe.gen2 },
  '2': { background: brand.color.equipe.gen3 },
})

// Swatch do tooltip (pequeno quadrado colorido) — mesma medida do tooltip do RxP.
export const tooltipSwatch = style({
  flexShrink: 0,
  inlineSize: brand.space.sm,
  blockSize: brand.space.sm,
  borderRadius: brand.radius.xs,
})

// Linha/dot/área da linha "por Ano" na cor da marca (o hover reusa hoverGuide do RxP).
export const equipeLinePath = style({
  fill: 'none',
  stroke: brand.color.equipe.line,
  strokeWidth: brand.rxp.lineStroke,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})
export const equipeLineDot = style({ fill: brand.color.equipe.line })
// Área sob a linha — preenche com o gradiente da Equipe (definido inline no SVG por <defs>).
export const areaFill = style({ fill: 'url(#equipeLineFill)' })
export const equipeAreaStopTop = style({ stopColor: brand.color.equipe.line, stopOpacity: 0.18 })
export const equipeAreaStopBottom = style({ stopColor: brand.color.equipe.line, stopOpacity: 0 })

// Rótulo do valor à direita da barra horizontal (Idade/Função) — contagem em tabular-nums.
export const hbarCount = style({
  fontSize: brand.text.chip,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

// Rótulo do eixo X (ano) do gráfico de linha.
export const yearText = style({
  fill: brand.color.ink500,
  fontSize: brand.rxp.svgAxisFont,
  fontFamily: 'inherit',
})

// Espaçador vertical entre título e conteúdo quando o card não é centralizado (barras verticais/linha).
export const chartBlock = style({ inlineSize: '100%' })
