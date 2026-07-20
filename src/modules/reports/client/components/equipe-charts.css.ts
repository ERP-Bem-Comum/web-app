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
/**
 * Pilha de barras horizontais que PREENCHE o card (Idade e Função).
 *
 * As linhas da base têm altura fixa (18px + margem), então o gráfico ocupava só o topo e o resto do card
 * ficava vazio — a grade é `stretch`, e o card é tão alto quanto o vizinho mais alto da linha. Aqui a
 * pilha vira coluna flex e cada linha ganha `flex: 1`: as barras se distribuem pelo espaço disponível,
 * qualquer que seja a quantidade de categorias. A ALTURA DA BARRA em si continua fixa (o `hbarTrack`
 * centralizado na linha) — barra gorda demais viraria bloco, e o que precisa respirar é o espaçamento.
 */
export const hbarsFill = style({
  blockSize: '100%',
  display: 'flex',
  flexDirection: 'column',
  // Respiro entre as linhas. Sem isto, com muitas categorias (Função tem 25) cada linha encolhe até a
  // altura da própria barra e elas ficam COLADAS, virando um bloco só. O `gap` garante a separação
  // independentemente da contagem — diferente de margem por linha, que some quando o espaço aperta.
  gap: brand.space.xs,
})

/**
 * Coluna do rótulo mais estreita que a da base (180px). Nos cards do Equipe — que dividem a linha em 2 ou
 * 3 — 180px fixos comiam quase metade da largura e jogavam as barras para a direita, mesmo com rótulos
 * curtos ("Até 29"). `max-content` limitado deixa a coluna caber no texto e devolve o espaço à barra.
 */
export const hbarNarrowName = style({
  gridTemplateColumns: `minmax(0, max-content) 1fr auto`,
})

/** Linha que cresce igualmente. `minBlockSize: 0` impede o overflow clássico de item flex em coluna. */
export const hbarRowFill = style({
  flex: 1,
  minBlockSize: 0,
  marginBlockEnd: 0,
})

export const hbarFillEquipe = style({
  display: 'block',
  blockSize: '100%',
  borderRadius: brand.radius.xs,
  // Levemente translúcida: em listas longas (Função) o bloco de cor sólida pesa muito na tela e compete
  // com o rótulo. `opacity` em vez de uma cor nova mantém o token da marca como fonte única do matiz.
  opacity: 0.88,
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
  // Preenche o card (a grade dos 3 é `stretch`: todos ficam com a altura do maior). Antes era `11rem`
  // fixo, o que achatava as barras no rodapé com um vazio enorme por cima.
  //
  // ⚠️ Tem que ser `blockSize: 100%`, NÃO `flex: 1`: a altura da barra (`vbarFill`) é uma PORCENTAGEM, e
  // porcentagem só resolve contra pai de altura DEFINIDA. Com `flex: 1` a cadeia deixa de ser definida e
  // toda barra colapsa para zero — o gráfico fica só com os números e os rótulos, sem barra nenhuma.
  blockSize: '100%',
  minBlockSize: '11rem',
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

/**
 * Donut do Equipe: maior que a base (7.5rem) — no legado o gráfico de gênero é o elemento dominante do
 * card, não uma miniatura acima de uma lista. Definido aqui e não na base para não afetar o relatório
 * Realizado × Planejado, que compartilha os mesmos átomos.
 */
/**
 * Rótulo escrito DENTRO da fatia da pizza (legado). Branco com leve sombra: as fatias têm cores de
 * luminância bem diferente (do dourado ao marrom escuro), e só branco puro sumiria nas claras.
 */
export const pieLabel = style({
  fill: brand.color.surface,
  fontSize: '0.5rem',
  fontWeight: brand.weight.semibold,
  paintOrder: 'stroke',
  stroke: brand.color.equipe.pieLabelOutline,
  strokeWidth: '0.06rem',
  pointerEvents: 'none',
})

export const donutLg = style({ inlineSize: '11rem', blockSize: '11rem' })

// Cor POR CATEGORIA, chaveada pelo `id` canônico do backend (core-api#477) — NÃO pelo índice.
// O índice quebrou quando o endpoint agregado passou a mandar 9 gêneros e 7 raças em outra ordem: cada
// cor foi parar na categoria errada. `id` é estável, então a cor acompanha a categoria para sempre.
// Categoria sem cor mapeada (ex.: balde `OUTROS`) cai no neutro — nunca rouba a cor de outra.
const racaColors = brand.color.equipe.raca
const generoColors = brand.color.equipe.genero
const fallback = brand.color.equipe.categoriaFallback

export const racaFill = styleVariants({
  ...Object.fromEntries(Object.entries(racaColors).map(([k, v]) => [k, { background: v }])),
  OUTROS: { background: fallback },
} as Record<string, { background: string }>)
export const racaSwatch = racaFill

export const generoDot = styleVariants({
  ...Object.fromEntries(Object.entries(generoColors).map(([k, v]) => [k, { background: v }])),
  OUTROS: { background: fallback },
} as Record<string, { background: string }>)
export const generoSwatch = generoDot

/** Traço do arco do donut — mesma chave por `id` (o SVG usa `stroke`, não `background`). */
export const generoStroke = styleVariants({
  ...Object.fromEntries(Object.entries(generoColors).map(([k, v]) => [k, { stroke: v }])),
  OUTROS: { stroke: fallback },
} as Record<string, { stroke: string }>)

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
