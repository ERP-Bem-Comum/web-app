import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.card,
  containerType: 'inline-size',
})

// Faixa de título da section (padrão dos forms de parceiro): cola no topo do card (cancela o padding
// com margens negativas), faixa suave, título azul tamanho md, ícone + texto.
export const sectionTitle = style({
  margin: 0,
  marginBlockStart: `calc(-1 * ${vars.space.lg})`,
  marginInline: `calc(-1 * ${vars.space.lg})`,
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.surface.subtle,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.nav.background,
})

export const grid = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: vars.space.md,
  '@container': {
    '(inline-size > 40rem)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    '(inline-size > 64rem)': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
  },
})

export const logoField = style({})

export const logoUpload = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  blockSize: '2.5rem',
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.subtle,
  color: vars.color.text.muted,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  cursor: 'not-allowed',
})

export const gatedHint = style({
  display: 'inline-flex',
  color: vars.color.brand.normal,
})

export const textareaField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  maxInlineSize: '48%',
  '@container': {
    '(inline-size <= 40rem)': { maxInlineSize: '100%' },
  },
})

export const label = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const textarea = style({
  minBlockSize: '6rem',
  resize: 'vertical',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
    '&:disabled': {
      background: vars.color.surface.subtle,
      color: vars.color.text.muted,
      cursor: 'not-allowed',
    },
  },
})
