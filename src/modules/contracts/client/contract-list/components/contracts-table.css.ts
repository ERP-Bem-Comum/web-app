import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const container = style({
  flex: '0 0 auto',
  width: '100%',
  minWidth: 0,
  overflow: 'auto',
  height: 'auto',
  maxHeight: 'calc(100dvh - 15rem)',
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  selectors: {
    '&::-webkit-scrollbar': {
      width: '0.625rem',
      height: '0.625rem',
    },
    '&::-webkit-scrollbar-track': {
      background: vars.color.institutional.paperWarm,
      borderRadius: vars.radius.md,
    },
    '&::-webkit-scrollbar-thumb': {
      // Bege/taupe visível sobre o trilho claro (nem escuro como `text.muted`, nem invisível).
      background: `color-mix(in srgb, ${vars.color.institutional.ink5} 45%, ${vars.color.institutional.paperRule})`,
      borderRadius: vars.radius.md,
      border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperWarm}`,
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: `color-mix(in srgb, ${vars.color.institutional.ink5} 70%, ${vars.color.institutional.paperRule})`,
    },
  },
})

export const table = style({
  width: '100%',
  minWidth: '95.625rem',
  tableLayout: 'fixed',
  borderCollapse: 'collapse',
})

export const thead = style({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: vars.color.institutional.paperWarm,
  color: vars.color.institutional.ink5,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.bold,
  fontFamily: vars.font.family.heading,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  lineHeight: 1.25,
  whiteSpace: 'nowrap',
})

export const thCell = style({
  height: '2.125rem',
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  paddingInline: vars.space.md,
  textAlign: 'left',
  fontWeight: vars.font.weight.bold,
})

export const colNumber = style({ width: '7.5rem' }) // ajustado p/ "CT 0001/2026" em uma linha
export const colContractor = style({ width: '17rem' }) // mais largo p/ mostrar mais do nome
export const colObject = style({ width: '16.25rem' })
export const colType = style({ width: '7rem', textAlign: 'center' })
export const colProgram = style({ width: '6.25rem', textAlign: 'center' })
export const colCurrentValue = style({ width: '8.125rem', textAlign: 'right' })
export const colBalance = style({ width: '7.5rem', textAlign: 'center' })
export const colPeriod = style({ width: '12.5rem', textAlign: 'center' }) // cabe em uma só linha (início — fim)
export const colAdditives = style({ width: '6.25rem', textAlign: 'center' })
export const colStatus = style({ width: '7.5rem', textAlign: 'center' })
export const colActions = style({ width: '4.375rem', textAlign: 'right' }) // ⋮ encostado à direita

export const emptyRow = style({
  height: '3.625rem',
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const emptyCell = style({
  textAlign: 'center',
  color: vars.color.institutional.ink5,
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.body,
})
