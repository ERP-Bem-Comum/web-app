/**
 * Estilos da barra de filtros do Consolidado ABC no padrão visual "brand" (mock `consolidado-brand`): card
 * branco (surface + borda line + sombra card + radius lg), flex align-end wrap. Campos: Ano Base (select 40px
 * com chevron), Programas (DROPDOWN multi-seleção — trigger 40px + painel com checkboxes), "Filtrar" (primary
 * com funil) e "Exportar Excel/CSV" (ghost empurrado à direita). Cores/px fora do kit vivem em
 * `consolidado.values.ts`; o resto vem de `brand`/`vars`. Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { consolidado } from '../consolidado.values.ts'

const sz = consolidado.size

export const bar = style({
  display: 'flex',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  gap: brand.space.xl,
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  padding: `${brand.space.lg} ${brand.space.panelInl}`,
  marginBlockEnd: brand.space.xl,
})

export const fieldWrap = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xs,
})

// Label ("Ano Base"/"Programas") ACIMA do controle — 11.5px 600 uppercase ink500.
export const fieldLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: sz.theadFont,
  fontWeight: brand.weight.semibold,
  letterSpacing: '.03em',
  textTransform: 'uppercase',
  color: brand.color.ink500,
  whiteSpace: 'nowrap',
})

// ── Campo Ano Base (select nativo estilizado como o `.select` do mock) ──
export const selectWrap = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  minInlineSize: sz.selectMinW,
})

export const selectChevron = style({
  position: 'absolute',
  insetInlineEnd: brand.space.md,
  display: 'inline-flex',
  alignItems: 'center',
  color: brand.color.ink400,
  pointerEvents: 'none',
})

export const select = style({
  blockSize: sz.ctrlH,
  inlineSize: '100%',
  paddingInlineStart: brand.space.md,
  paddingInlineEnd: `calc(${brand.space.md} + ${brand.space.xl})`,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.medium,
  cursor: 'pointer',
  appearance: 'none',
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// ── Botões ──
const buttonBase = style({
  blockSize: sz.ctrlH,
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
  paddingInline: brand.space.xl,
  borderRadius: brand.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const buttonIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
})

// "Filtrar" — primary preenchido + funil.
export const applyButton = style([
  buttonBase,
  {
    border: 'none',
    background: brand.color.primary,
    color: brand.color.surface,
    boxShadow: brand.shadow.btn,
    selectors: { '&:hover': { background: brand.color.primaryHover } },
  },
])

// "Exportar Excel/CSV" — ghost (border line) + download, empurrado à direita.
export const exportButton = style([
  buttonBase,
  {
    marginInlineStart: 'auto',
    paddingInline: brand.space.lg,
    border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    background: brand.color.surface,
    color: brand.color.ink700,
    selectors: {
      '&:hover': { borderColor: brand.color.lineStrong, background: brand.color.surfaceAlt },
    },
  },
])
