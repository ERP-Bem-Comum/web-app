import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const dialog = style({
  border: 'none',
  inlineSize: '100%',
  maxInlineSize: '44rem',
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  boxShadow: vars.shadow.cardElevated,
  selectors: {
    '&[open]': { display: 'flex', flexDirection: 'column', gap: vars.space.md },
    '&::backdrop': { background: vars.color.institutional.overlay },
  },
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBlockEnd: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const closeButton = style({
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.xl,
  lineHeight: 1,
  cursor: 'pointer',
  paddingInline: vars.space.xs,
  selectors: {
    '&:hover': { color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const body = style({
  display: 'flex',
  gap: vars.space.xl,
  '@media': {
    '(max-width: 36rem)': { flexDirection: 'column' },
  },
})

export const avatarCol = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  flexShrink: 0,
})

export const avatar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '8rem',
  blockSize: '8rem',
  borderRadius: vars.radius.md,
  background: vars.color.surface.subtle,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
})

export const fieldsCol = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  flex: 1,
  minInlineSize: 0,
})

export const gatedButton = style({
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.subtle,
  color: vars.color.text.muted,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'not-allowed',
})

export const gatedHint = style({
  margin: 0,
  maxInlineSize: '8rem',
  textAlign: 'center',
  color: vars.color.text.muted,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
})

export const errorBanner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: vars.space.md,
})

export const cancelButton = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const saveWrap = style({
  inlineSize: '8rem',
})
