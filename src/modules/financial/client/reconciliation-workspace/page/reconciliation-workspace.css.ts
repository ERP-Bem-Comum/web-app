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

// ── conciliação view (2 colunas: imports | associação) ──────────────────────────
export const conciliacaoView = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(20rem, 28rem) 1fr',
  minBlockSize: '100%',
})

export const importsCol = style({
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.surface.default,
  borderInlineEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const importsHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingInline: vars.space.md,
  paddingBlock: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const filterTabs = style({ display: 'flex', gap: vars.space.xs, marginInlineStart: 'auto' })

const filterTabBase = {
  border: 'none',
  background: 'transparent',
  paddingInline: vars.space.sm,
  paddingBlock: '0.25rem',
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  cursor: 'pointer',
} as const

export const filterTab = styleVariants({
  inactive: { ...filterTabBase, color: vars.color.text.muted },
  active: {
    ...filterTabBase,
    color: vars.color.text.primary,
    fontWeight: vars.font.weight.semibold,
    background: vars.color.surface.subtle,
  },
})

export const importsList = style({ display: 'flex', flexDirection: 'column', overflowY: 'auto' })

export const dayDivider = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingInline: vars.space.md,
  paddingBlock: '0.375rem',
  background: vars.color.surface.canvas,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.text.muted,
})

const txRowBase = {
  display: 'grid',
  gridTemplateColumns: '2rem 1fr auto',
  gap: vars.space.sm,
  alignItems: 'center',
  inlineSize: '100%',
  textAlign: 'start',
  border: 'none',
  paddingInline: vars.space.md,
  paddingBlock: vars.space.sm,
  background: 'transparent',
  cursor: 'pointer',
  borderInlineStart: `${vars.borderWidth.thick} solid transparent`,
  borderBlockEnd: `${vars.borderWidth.hairline} solid ${vars.color.border.subtle}`,
} as const

export const txRow = styleVariants({
  base: { ...txRowBase },
  selected: {
    ...txRowBase,
    background: vars.color.surface.subtle,
    borderInlineStartColor: vars.color.brand.normal,
  },
  reconciled: { ...txRowBase, opacity: 0.62 },
})

export const txIcon = style({
  inlineSize: '1.875rem',
  blockSize: '1.875rem',
  borderRadius: vars.radius.sm,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const txIconKind = styleVariants({
  in: { background: vars.color.status.activeBg, color: vars.color.status.activeText },
  out: { background: vars.color.feedback.errorBg, color: vars.color.feedback.errorText },
  transfer: { background: vars.color.institutional.blueBg, color: vars.color.institutional.blueDeep },
  fee: { background: vars.color.institutional.paperBeige, color: vars.color.institutional.ink3 },
  investment: { background: vars.color.institutional.orangeLight, color: vars.color.institutional.orange },
})

export const txBody = style({ display: 'flex', flexDirection: 'column', gap: '0.125rem', minInlineSize: 0 })
export const txDate = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.text.muted,
})
export const txName = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const txDesc = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const txAmtBlock = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.125rem',
})

export const txAmt = styleVariants({
  in: {
    fontFamily: vars.font.family.mono,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.institutional.greenDeep,
  },
  out: {
    fontFamily: vars.font.family.mono,
    fontSize: vars.font.size.sm,
    fontWeight: vars.font.weight.semibold,
    color: vars.color.feedback.errorText,
  },
})

export const txTag = styleVariants({
  pending: {
    fontFamily: vars.font.family.mono,
    fontSize: vars.font.size['2xs'],
    color: vars.color.status.pendingText,
    background: vars.color.status.pendingBg,
    paddingInline: vars.space.xs,
    paddingBlock: '0.0625rem',
    borderRadius: vars.radius.sm,
  },
  reconciled: {
    fontFamily: vars.font.family.mono,
    fontSize: vars.font.size['2xs'],
    color: vars.color.status.activeText,
    background: vars.color.status.activeBg,
    paddingInline: vars.space.xs,
    paddingBlock: '0.0625rem',
    borderRadius: vars.radius.sm,
  },
})

// ── coluna de associação (Sugestão) ─────────────────────────────────────────────
export const assocCol = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
  overflowY: 'auto',
})

export const assocTabs = style({ display: 'flex', gap: vars.space.xs })

export const matchCard = style({
  border: `${vars.borderWidth.thin} solid ${vars.color.status.activeText}`,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  background: vars.color.surface.default,
})

export const matchHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  paddingInline: vars.space.md,
  paddingBlock: vars.space.sm,
  background: vars.color.status.activeBg,
  color: vars.color.status.activeText,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.status.activeText}`,
})

export const matchSides = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: vars.space.sm,
  alignItems: 'center',
  padding: vars.space.md,
})

export const matchSide = styleVariants({
  extrato: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: vars.space.sm,
    borderRadius: vars.radius.md,
    background: vars.color.surface.canvas,
    border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  },
  doc: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: vars.space.sm,
    borderRadius: vars.radius.md,
    background: vars.color.institutional.blueBg,
    border: `${vars.borderWidth.thin} solid ${vars.color.institutional.blueLine}`,
  },
})

export const matchArrow = style({ color: vars.color.institutional.green, fontFamily: vars.font.family.mono })
export const sideLbl = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.text.muted,
})
export const sideTitle = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})
export const sideRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  fontSize: vars.font.size.xs,
})
export const sideKey = style({ color: vars.color.text.muted })
export const sideVal = style({ fontFamily: vars.font.family.mono, color: vars.color.text.secondary })

export const critList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
  paddingInline: vars.space.md,
  paddingBlockEnd: vars.space.sm,
})
export const crit = styleVariants({
  ok: {
    fontFamily: vars.font.family.body,
    fontSize: vars.font.size['2xs'],
    color: vars.color.status.activeText,
    background: vars.color.status.activeBg,
    paddingInline: vars.space.xs,
    paddingBlock: '0.125rem',
    borderRadius: vars.radius.sm,
  },
  warn: {
    fontFamily: vars.font.family.body,
    fontSize: vars.font.size['2xs'],
    color: vars.color.status.pendingText,
    background: vars.color.status.pendingBg,
    paddingInline: vars.space.xs,
    paddingBlock: '0.125rem',
    borderRadius: vars.radius.sm,
  },
})

export const matchActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: vars.space.md,
  background: vars.color.surface.canvas,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})
export const spacer = style({ flex: 1 })

export const btnConfirm = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  paddingInline: vars.space.md,
  paddingBlock: '0.5rem',
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.institutional.greenDeep,
  color: vars.color.brand.onBrand,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: { '&:disabled': { opacity: 0.55, cursor: 'not-allowed' } },
})

export const altList = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs })
export const altCard = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
})

export const errorText = style({
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
})
export const summaryNote = style({
  color: vars.color.institutional.greenDeep,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
})

// ── assoc tabs (Sugestão | Nova | Buscar/Criar vários) ──────────────────────────
const assocTabBase = {
  border: 'none',
  background: 'transparent',
  paddingInline: vars.space.sm,
  paddingBlock: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  cursor: 'pointer',
  borderBlockEnd: `${vars.borderWidth.thick} solid transparent`,
} as const
export const assocTab = styleVariants({
  inactive: { ...assocTabBase, color: vars.color.text.muted },
  active: {
    ...assocTabBase,
    color: vars.color.text.primary,
    fontWeight: vars.font.weight.semibold,
    borderBlockEndColor: vars.color.brand.normal,
  },
})

// ── Buscar / Criar vários (US3) ─────────────────────────────────────────────────
export const multiSummary = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  flexWrap: 'wrap',
})
export const summaryItem = style({ display: 'flex', flexDirection: 'column', gap: '0.125rem' })
export const summaryLbl = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size['2xs'],
  color: vars.color.text.muted,
})
export const summaryVal = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})
export const diffPill = styleVariants({
  zero: {
    marginInlineStart: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    padding: vars.space.sm,
    borderRadius: vars.radius.md,
    background: vars.color.status.activeBg,
    color: vars.color.status.activeText,
  },
  open: {
    marginInlineStart: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    padding: vars.space.sm,
    borderRadius: vars.radius.md,
    background: vars.color.status.pendingBg,
    color: vars.color.status.pendingText,
  },
})

export const payGrid = style({
  display: 'flex',
  flexDirection: 'column',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  overflow: 'hidden',
})
export const payRow = style({
  display: 'grid',
  gridTemplateColumns: '1.25rem 1fr auto',
  gap: vars.space.sm,
  alignItems: 'center',
  inlineSize: '100%',
  textAlign: 'start',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  paddingInline: vars.space.sm,
  paddingBlock: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.hairline} solid ${vars.color.border.subtle}`,
})
export const payRowSelected = style({ background: vars.color.surface.subtle })
export const checkbox = styleVariants({
  on: {
    inlineSize: '1rem',
    blockSize: '1rem',
    borderRadius: vars.radius.sm,
    background: vars.color.brand.normal,
    border: `${vars.borderWidth.thin} solid ${vars.color.brand.normal}`,
  },
  off: {
    inlineSize: '1rem',
    blockSize: '1rem',
    borderRadius: vars.radius.sm,
    background: vars.color.surface.default,
    border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  },
})
export const payName = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const payMeta = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.text.muted,
})
export const payAmt = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
})

export const treatmentRow = style({ display: 'flex', flexWrap: 'wrap', gap: vars.space.xs })
const treatmentCardBase = {
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  borderRadius: vars.radius.md,
  paddingInline: vars.space.sm,
  paddingBlock: '0.375rem',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  cursor: 'pointer',
} as const
export const treatmentCard = styleVariants({
  off: { ...treatmentCardBase, color: vars.color.text.secondary },
  on: {
    ...treatmentCardBase,
    color: vars.color.status.pendingText,
    background: vars.color.status.pendingBg,
    borderColor: vars.color.status.pendingText,
  },
})

// ── Nova transação (US4) ────────────────────────────────────────────────────────
export const typeGrid = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: vars.space.sm })
const typeCardBase = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  borderRadius: vars.radius.md,
  padding: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  cursor: 'pointer',
  textAlign: 'center',
} as const
export const typeCard = styleVariants({
  off: { ...typeCardBase },
  on: {
    ...typeCardBase,
    color: vars.color.brand.normal,
    background: vars.color.brand.disabled,
    borderColor: vars.color.brand.normal,
  },
})
export const formField = style({ display: 'flex', flexDirection: 'column', gap: '0.25rem' })
export const fieldLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})
export const input = style({
  inlineSize: '100%',
  paddingInline: vars.space.sm,
  paddingBlock: '0.5rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})
export const confirmRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})
export const warnBox = style({
  display: 'flex',
  gap: vars.space.sm,
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  background: vars.color.status.pendingBg,
  color: vars.color.status.pendingText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
})

// ── Desfazer (US5) ──────────────────────────────────────────────────────────────
export const banner = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  background: vars.color.status.activeBg,
  border: `${vars.borderWidth.thin} solid ${vars.color.status.activeText}`,
})
export const bannerTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  color: vars.color.status.activeText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
})

// ── Aba Extrato (US8) ───────────────────────────────────────────────────────────
export const extWrap = style({
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: '100%',
  background: vars.color.surface.default,
})
export const extHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingInline: vars.space.lg,
  paddingBlock: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})
export const extRows = style({ display: 'flex', flexDirection: 'column', overflowY: 'auto' })
const extGridCols = {
  display: 'grid',
  gridTemplateColumns: '6rem 1fr 7rem 7rem 8rem',
  gap: vars.space.sm,
  alignItems: 'center',
} as const
export const extRow = style({
  ...extGridCols,
  paddingInline: vars.space.lg,
  paddingBlock: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.hairline} solid ${vars.color.border.subtle}`,
})
export const extHeadRow = style({
  ...extGridCols,
  paddingInline: vars.space.lg,
  paddingBlock: vars.space.sm,
  background: vars.color.surface.canvas,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size['2xs'],
  color: vars.color.text.muted,
  textTransform: 'uppercase',
})
export const extFoot = style({
  ...extGridCols,
  paddingInline: vars.space.lg,
  paddingBlock: vars.space.sm,
  background: vars.color.surface.canvas,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  fontFamily: vars.font.family.mono,
  fontWeight: vars.font.weight.bold,
})
export const extCellMono = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})
export const extCellMonoRight = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  textAlign: 'end',
  color: vars.color.text.secondary,
})
export const extIn = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  textAlign: 'end',
  color: vars.color.institutional.greenDeep,
})
export const extOut = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  textAlign: 'end',
  color: vars.color.feedback.errorText,
})
export const extName = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
