import { style } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens/index.ts'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  background: vars.color.institutional.overlay,
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 320,
  padding: vars.space.lg,
})

export const content = style({
  position: 'relative',
  background: vars.color.surface.default,
  borderRadius: vars.radius.xl,
  boxShadow: vars.shadow.cardElevated,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  width: '100%',
  maxWidth: '52rem',
  height: '85vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: '0.9375rem',
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const headActions = style({ display: 'flex', alignItems: 'center', gap: vars.space.md, flexShrink: 0 })

export const downloadLink = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blueDeep,
  textDecoration: 'none',
  ':hover': { textDecoration: 'underline' },
})

export const close = style({
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink4,
  fontSize: '1.25rem',
  lineHeight: 1,
  cursor: 'pointer',
  ':hover': { color: vars.color.institutional.ink2 },
})

export const body = style({
  flex: 1,
  minHeight: 0,
  background: vars.color.institutional.paperWarm,
  display: 'flex',
})

export const frame = style({
  flex: 1,
  border: 'none',
  width: '100%',
  height: '100%',
})

export const placeholder = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  textAlign: 'center',
  padding: vars.space.xl,
})

export const placeholderIcon = style({ fontSize: '2rem', opacity: 0.5 })

export const placeholderTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink3,
})

export const placeholderText = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink5,
  lineHeight: 1.5,
})
