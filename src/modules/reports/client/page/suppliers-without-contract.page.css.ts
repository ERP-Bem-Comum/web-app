/**
 * Estilos da page "Fornecedores sem Contrato" — cabeçalho brand (título + subtítulo) com uma área de AÇÕES
 * (toggle "Filtros" + Exportar), o painel de filtros RECOLHÍVEL (mesmo padrão do "Realizado × Planejado":
 * max-height/opacity animados) e o card do gráfico de compliance. Identidade "brand", só-tokens §X (nenhum
 * hex/px cru aqui). O painel de filtros em si continua vindo da kit compartilhada (ReportFilters); estes
 * estilos apenas o abrigam no contêiner colapsável e dão o chrome do card do gráfico.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Área de ações no cabeçalho (empurra pra direita; toggle + Exportar).
export const tools = style({
  marginInlineStart: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
})

// Botão "Filtros" (ghost) — estado ativo (aria-pressed) quando o painel está aberto.
export const filterToggle = style({
  blockSize: brand.size.btnHeight,
  paddingInline: brand.space.gridCol,
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.sm,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.surfaceAlt, borderColor: brand.color.lineStrong },
    '&[aria-pressed="true"]': {
      background: brand.color.cadBg,
      borderColor: brand.color.lineStrong,
      color: brand.color.primary,
    },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// Contêiner colapsável dos filtros (max-height/opacity animados). O painel brand vai dentro.
export const filters = styleVariants({
  closed: {
    overflow: 'hidden',
    maxBlockSize: 0,
    opacity: 0,
    marginBlockEnd: 0,
    transition: 'max-height .25s ease, opacity .2s, margin .2s',
  },
  open: {
    overflow: 'hidden',
    maxBlockSize: '40rem',
    opacity: 1,
    marginBlockEnd: brand.space.xl,
    transition: 'max-height .3s ease, opacity .2s, margin .2s',
  },
})

// ── Card do gráfico de compliance ──
export const chartCard = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  marginBlockEnd: brand.space.xl,
  display: 'flex',
  flexDirection: 'column',
})

export const cardHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  paddingBlock: brand.space.gridRow,
  paddingInline: brand.space.gridCol,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
})
export const cardTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.sectionH2,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})
export const cardSummary = style({
  marginInlineStart: 'auto',
  fontSize: brand.text.hint,
  color: brand.color.ink500,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

export const chartPad = style({
  padding: `${brand.space.gridRow} ${brand.space.gridCol} ${brand.space.gridCol}`,
  flex: 1,
})

// ── Legenda de status (dentro do header do card) ──
export const legend = style({
  marginInlineStart: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.lg,
})
export const legendItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.xs,
  fontSize: brand.text.hint,
  color: brand.color.ink500,
  whiteSpace: 'nowrap',
})
export const legendDot = style({
  inlineSize: '0.5625rem',
  blockSize: '0.5625rem',
  borderRadius: brand.radius.xs,
  flexShrink: 0,
})
export const legendDotStatus = styleVariants({
  over: { background: brand.color.dangerDot },
  at: { background: brand.color.atLimitFg },
  within: { background: brand.color.primary },
})
