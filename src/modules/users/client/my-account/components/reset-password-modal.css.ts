import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const dialog = style({
  border: 'none',
  inlineSize: '100%',
  maxInlineSize: '28rem',
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

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

export const fieldRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  paddingInlineEnd: vars.space.sm,
  selectors: {
    '&:focus-within': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const input = style({
  flex: 1,
  minInlineSize: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  selectors: {
    '&:focus': { outline: 'none' },
  },
})

export const eyeButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: vars.color.brand.normal,
  cursor: 'pointer',
  padding: vars.space.xs,
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const mismatch = style({
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
})

export const rulesTitle = style({
  margin: 0,
  marginBlockEnd: vars.space.xs,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const rulesList = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const rule = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const ruleIconOk = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.1rem',
  color: vars.color.status.activeText,
  fontWeight: vars.font.weight.semibold,
})

export const ruleIconFail = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.1rem',
  color: vars.color.feedback.errorText,
  fontWeight: vars.font.weight.semibold,
})

export const errorBanner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const saveButtonWrap = style({
  marginBlockStart: vars.space.sm,
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
