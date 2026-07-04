import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { geography } from '../geography.values.ts'

// Página full-bleed (rota em `fullBleedContent`): canvas azul-claro do mock ocupando toda a largura
// (sem coluna central — pedido da P.O.), rolagem própria + scrollbar visível. Filhos não encolhem.
export const screen = style({
  boxSizing: 'border-box',
  blockSize: '100%',
  overflowY: 'auto',
  padding: brand.space.xxl,
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xl,
  background: geography.pageBg,
  fontFamily: vars.font.family.heading, // Inter
  color: brand.color.ink700,
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.625rem' },
    '&::-webkit-scrollbar-thumb': { background: brand.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

// Filhos não encolhem (senão os cards são espremidos ao invés de o container rolar).
globalStyle(`${screen} > *`, { flexShrink: 0 })

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xl,
  flexShrink: 0,
})

export const columns = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: brand.space.xl,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 60rem)': { gridTemplateColumns: '1fr' },
  },
})

// Wrapper do <select> de UF (chevron desenhado, appearance:none).
export const selectWrap = style({
  position: 'relative',
  marginBlockEnd: brand.space.md,
})

export const ufSelect = style({
  inlineSize: '100%',
  blockSize: brand.size.ctrlH,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.sm,
  background: brand.color.surface,
  paddingInlineStart: brand.space.lg,
  paddingInlineEnd: '2.375rem', // espaço do chevron
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  color: brand.color.ink700,
  appearance: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
  transition: `border-color ${brand.ease}, box-shadow ${brand.ease}`,
  selectors: {
    '&:focus': {
      outline: 'none',
      borderColor: brand.color.primary,
      boxShadow: brand.shadow.focus,
    },
  },
})

export const selectChevron = style({
  position: 'absolute',
  insetInlineEnd: brand.space.md,
  insetBlockStart: '50%',
  transform: 'translateY(-50%)',
  color: brand.color.ink400,
  display: 'grid',
  placeItems: 'center',
  pointerEvents: 'none',
})

export const errorBanner = style({
  padding: brand.space.md,
  borderRadius: brand.radius.sm,
  background: brand.color.dangerBg,
  color: brand.color.dangerFg,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
})
