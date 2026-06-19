/**
 * Workspace de Conciliação — estilos (vanilla-extract, só-tokens §X). Estrutura fiel ao mock
 * `conciliacao_bancaria` (acc-header · tabs-bar · workspace · bottombar). A marca teal do mock mapeia para
 * os tokens do DS (marca/azul institucional); status verde/laranja via tokens institucionais. Os painéis
 * de associação (Sugestão/Nova/Buscar) entram com US1–US4.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: '100%',
  paddingBlockEnd: '4rem', // espaço p/ a bottombar fixa
  background: vars.color.surface.canvas,
})

// ── acc-header ────────────────────────────────────────────────────────────────
export const accHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  paddingInline: vars.space.lg,
  paddingBlock: vars.space.md,
  background: vars.color.surface.default,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const accId = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm, minInlineSize: 0 })

export const bankMark = style({
  inlineSize: '2.75rem',
  blockSize: '2.75rem',
  borderRadius: vars.radius.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  flexShrink: 0,
})

export const accInfo = style({ display: 'flex', flexDirection: 'column', gap: '0.125rem', minInlineSize: 0 })

export const overline = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  letterSpacing: '0.06em',
  color: vars.color.text.muted,
})

export const accName = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export const accMeta = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.text.secondary,
})

export const balanceBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  paddingInline: vars.space.lg,
  marginInlineStart: 'auto',
  borderInline: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const balanceVal = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const accActions = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })

export const pill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  paddingInline: vars.space.sm,
  paddingBlock: '0.375rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
})

export const btnPrimary = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  paddingInline: vars.space.md,
  paddingBlock: '0.5rem',
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      background: vars.color.brand.disabled,
      color: vars.color.brand.onDisabled,
      cursor: 'not-allowed',
    },
  },
})

export const btnSecondary = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  paddingInline: vars.space.md,
  paddingBlock: '0.5rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  cursor: 'pointer',
  selectors: {
    '&:disabled': { opacity: 0.55, cursor: 'not-allowed' },
  },
})

// ── tabs-bar ───────────────────────────────────────────────────────────────────
export const tabsBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.surface.default,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const tabs = style({ display: 'flex', gap: vars.space.xs })

const tabBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  paddingInline: vars.space.sm,
  paddingBlock: vars.space.sm,
  border: 'none',
  background: 'transparent',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  cursor: 'pointer',
  borderBlockEnd: `${vars.borderWidth.thick} solid transparent`,
} as const

export const tab = styleVariants({
  inactive: { ...tabBase, color: vars.color.text.muted },
  active: {
    ...tabBase,
    color: vars.color.text.primary,
    fontWeight: vars.font.weight.semibold,
    borderBlockEndColor: vars.color.brand.normal,
  },
})

export const badge = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  paddingInline: '0.375rem',
  paddingBlock: '0.0625rem',
  borderRadius: vars.radius.sm,
  background: vars.color.surface.subtle,
  color: vars.color.text.secondary,
})

export const tabsRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  marginInlineStart: 'auto',
})

export const progressMini = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

export const progressBar = style({
  inlineSize: '5.625rem',
  blockSize: '0.3125rem',
  borderRadius: vars.radius.sm,
  background: vars.color.surface.subtle,
  overflow: 'hidden',
})

export const progressFill = style({
  blockSize: '100%',
  background: vars.color.brand.normal,
})

export const progressNum = style({ fontFamily: vars.font.family.mono, fontSize: vars.font.size['2xs'] })

export const toggle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
})

const switchBase = {
  inlineSize: '1.75rem',
  blockSize: '1rem',
  borderRadius: vars.radius.xl,
  position: 'relative',
  transition: 'background 120ms',
} as const

export const switchTrack = styleVariants({
  on: { ...switchBase, background: vars.color.brand.normal },
  off: { ...switchBase, background: vars.color.border.default },
})

// ── workspace body ───────────────────────────────────────────────────────────
export const workspace = style({ flex: 1, position: 'relative', background: vars.color.surface.canvas })

export const emptyState = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  paddingBlock: vars.space.xl,
  paddingInline: vars.space.lg,
  textAlign: 'center',
  color: vars.color.text.muted,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const noticeChrome = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  paddingInline: vars.space.sm,
  paddingBlock: '0.25rem',
  borderRadius: vars.radius.sm,
  background: vars.color.institutional.orangeLight,
  color: vars.color.institutional.orange,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
})

// ── bottombar ─────────────────────────────────────────────────────────────────
export const bottombar = style({
  position: 'fixed',
  insetBlockEnd: 0,
  insetInline: 0,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  paddingInline: vars.space.lg,
  paddingBlock: vars.space.sm,
  background: vars.color.surface.default,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const auditNote = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

export const bottomActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  marginInlineStart: 'auto',
})
