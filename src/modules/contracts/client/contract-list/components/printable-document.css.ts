import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Documento imprimível: invisível na tela; aparece apenas na impressão (window.print → "Salvar como PDF").
export const doc = style({
  display: 'none',
  '@media': {
    print: {
      display: 'block',
      padding: vars.space.xl,
      fontFamily: vars.font.family.body,
      color: vars.color.institutional.ink2,
    },
  },
})

export const docHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  paddingBlockEnd: vars.space.md,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.ink2}`,
})

export const org = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const title = style({
  margin: 0,
  marginBlockStart: vars.space.lg,
  marginBlockEnd: vars.space.lg,
  textAlign: 'center',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.06em',
  color: vars.color.institutional.ink2,
})

export const emitted = style({
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink4,
})

export const infoGrid = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  columnGap: vars.space.lg,
  rowGap: vars.space.sm,
  marginBlockEnd: vars.space.lg,
})

export const infoLabel = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink3,
})

export const infoValue = style({
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
})

export const declaration = style({
  fontSize: vars.font.size.sm,
  lineHeight: 1.7,
  textAlign: 'justify',
  marginBlockEnd: vars.space.xl,
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  marginBlockEnd: vars.space.xl,
  fontSize: vars.font.size.sm,
})

export const th = style({
  textAlign: 'left',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.ink3}`,
  fontFamily: vars.font.family.heading,
  fontWeight: vars.font.weight.bold,
})

export const tdEmpty = style({
  paddingBlock: vars.space.lg,
  paddingInline: vars.space.sm,
  textAlign: 'center',
  color: vars.color.institutional.ink4,
})

export const signatures = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: vars.space.xl,
  marginBlockStart: vars.space.xl,
})

export const signatureBox = style({
  flex: 1,
  textAlign: 'center',
  paddingBlockStart: vars.space.sm,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.ink2}`,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink3,
})
