import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

/* ─── Estilos de impressão (PDF via window.print) ─── */

globalStyle('nav, header', {
  '@media': {
    print: {
      display: 'none !important',
    },
  },
})

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: '100vh',
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  minHeight: '3.5rem',
  paddingInline: vars.space.md,
  paddingBlock: '0.625rem',
})

export const filterToggle = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.25rem',
  height: '2.25rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink3,
  cursor: 'pointer',
  fontSize: vars.font.size.sm,
  lineHeight: 1,
  flexShrink: 0,
  ':hover': {
    background: vars.color.institutional.paperWarm,
  },
})

export const filterToggleActive = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.25rem',
  height: '2.25rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.blueLine}`,
  background: vars.color.institutional.blueBg,
  color: vars.color.institutional.blueDeep,
  cursor: 'pointer',
  fontSize: vars.font.size.sm,
  lineHeight: 1,
  flexShrink: 0,
  ':hover': {
    background: vars.color.institutional.blueBg,
  },
})

export const searchWrap = style({
  position: 'relative',
  flex: 1,
  maxWidth: '26.875rem',
})

export const searchIcon = style({
  position: 'absolute',
  insetInlineStart: vars.space.sm,
  top: '50%',
  transform: 'translateY(-50%)',
  color: vars.color.institutional.ink4,
  fontSize: vars.font.size.md,
  pointerEvents: 'none',
  lineHeight: 1,
})

export const searchInput = style({
  width: '100%',
  height: '2.25rem',
  paddingInlineStart: '2.25rem',
  paddingInlineEnd: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink3,
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.family.body,
  ':focus': {
    outline: 'none',
    borderColor: vars.color.institutional.blueLine,
  },
  '::placeholder': {
    color: vars.color.institutional.ink4,
  },
})

export const chipsWrap = style({
  marginInlineStart: 'auto',
})

export const filtersArea = style({
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const tableWrap = style({
  flex: '0 0 auto',
  paddingInline: vars.space.md,
  paddingTop: vars.space.md,
  paddingBottom: '5rem',
  overflow: 'visible',
  display: 'flex',
  flexDirection: 'column',
})

export const bottombar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  height: '3.5rem',
  paddingInline: vars.space.lg,
  background: vars.color.institutional.paperWarm,
  borderTop: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  flexShrink: 0,
  position: 'fixed',
  bottom: 0,
  insetInlineStart: 'var(--sidebar-width, 16.25rem)',
  insetInlineEnd: 0,
  zIndex: 100,
})

export const exportButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingInline: vars.space.md,
  paddingBlock: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink3,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  fontFamily: vars.font.family.body,
  cursor: 'pointer',
  textDecoration: 'none',
  flexShrink: 0,
  ':hover': {
    background: vars.color.institutional.paperWarm,
    borderColor: vars.color.institutional.ink4,
  },
})

export const newButton = style({
  marginInlineStart: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingInline: vars.space.md,
  paddingBlock: vars.space.sm,
  borderRadius: vars.radius.md,
  background: vars.color.institutional.blue,
  color: vars.color.surface.default,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  fontFamily: vars.font.family.body,
  textDecoration: 'none',
  ':hover': {
    background: vars.color.institutional.blueDeep,
  },
})

/* ─── Media print (referenciando classes já definidas) ─── */

globalStyle(`${header}, ${filtersArea}, ${bottombar}`, {
  '@media': {
    print: {
      display: 'none !important',
    },
  },
})

globalStyle(tableWrap, {
  '@media': {
    print: {
      overflow: 'visible !important',
      height: 'auto !important',
      paddingTop: '0 !important',
      paddingBottom: '0 !important',
    },
  },
})

globalStyle(`${tableWrap} > div`, {
  '@media': {
    print: {
      overflow: 'visible !important',
      height: 'auto !important',
      maxHeight: 'none !important',
    },
  },
})
