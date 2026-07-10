/**
 * Estilos da tabela da Curva ABC (Consolidado ABC) — só-tokens (§X): cartão branco com cabeçalho, tabela de
 * 3 colunas (Programa · Total · Participação) e a barra de participação (trilho + preenchimento primary). Px
 * cru só via `consolidado.values.ts`; o resto vem de `brand`/`vars`.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { consolidado } from '../consolidado.values.ts'

export const card = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  overflow: 'hidden',
})

export const head = style({
  display: 'flex',
  alignItems: 'center',
  padding: `${brand.space.lg} ${brand.space.xl}`,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

export const headTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: consolidado.size.sectionTitleFont,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  fontFamily: vars.font.family.heading,
})

export const th = style({
  textAlign: 'start',
  padding: `${consolidado.size.theadPadBlock} ${brand.space.xl}`,
  fontSize: consolidado.size.theadFont,
  fontWeight: brand.weight.semibold,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  color: brand.color.ink500,
  background: brand.color.surfaceAlt,
})

export const thNum = style([th, { textAlign: 'end' }])

export const tr = style({
  borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  selectors: { '&:hover': { background: consolidado.rowHover } },
})

export const cellProgram = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  padding: `${consolidado.size.rowPadBlock} ${brand.space.xl}`,
  fontSize: consolidado.size.nameFont,
  color: brand.color.ink700,
})

export const progTag = style({
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: consolidado.size.progTagPadBlock,
  paddingInline: consolidado.size.progTagPadInline,
  borderRadius: brand.radius.xs,
  background: brand.color.cadBg,
  color: brand.color.primary,
  fontWeight: brand.weight.semibold,
  fontSize: consolidado.size.progTagFont,
  letterSpacing: '.02em',
  flexShrink: 0,
})

export const progName = style({
  color: brand.color.ink900,
  fontWeight: brand.weight.medium,
})

export const progVersion = style({
  fontSize: consolidado.size.subFont,
  color: brand.color.ink500,
})

export const cellTotal = style({
  padding: `${consolidado.size.rowPadBlock} ${brand.space.xl}`,
  textAlign: 'end',
  whiteSpace: 'nowrap',
  fontSize: consolidado.size.nameFont,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
})

export const cellShare = style({
  padding: `${consolidado.size.rowPadBlock} ${brand.space.xl}`,
  textAlign: 'end',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: brand.space.sm,
})

export const shareTrack = style({
  inlineSize: consolidado.size.shareTrackW,
  blockSize: consolidado.size.shareBarH,
  borderRadius: brand.radius.pill,
  background: brand.color.line2,
  overflow: 'hidden',
  flexShrink: 0,
})

export const shareBar = style({
  display: 'block',
  blockSize: '100%',
  minInlineSize: consolidado.size.shareBarMin,
  borderRadius: brand.radius.pill,
  background: brand.color.primary,
})

export const shareValue = style({
  minInlineSize: consolidado.size.shareValW,
  textAlign: 'end',
  fontSize: consolidado.size.subFont,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
  fontVariantNumeric: 'tabular-nums',
})
