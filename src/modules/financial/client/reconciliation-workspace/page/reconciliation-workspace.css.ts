/**
 * Workspace de Conciliação — estilos (vanilla-extract). **Fidelidade ao mock** `conciliacao_bancaria`
 * via a camada de tokens do módulo (`recon.values.ts`, espelha o `:root` da consultoria — teal/paper/ink/
 * Fraunces). Mantém TODOS os nomes de export consumidos pela page/componentes. §X: zero literal cru aqui
 * (tudo via `recon.*`).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { recon } from '../../recon-ui/recon.values.ts'

const c = recon.color
const sp = recon.space
const fs = recon.size
const r = recon.radius
const bw = recon.border

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: '100%',
  paddingBlockEnd: '3.5rem',
  background: c.paper.warm,
  color: c.ink[2],
})

// ── acc-header (h ~88px) ────────────────────────────────────────────────────────
export const accHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.xl,
  paddingInline: sp['3xl'],
  paddingBlock: sp['2xl'],
  background: c.paper.default,
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
})

export const accId = style({ display: 'flex', alignItems: 'center', gap: sp.xl, minInlineSize: 0 })

export const bankMark = style({
  inlineSize: '2.75rem',
  blockSize: '2.75rem',
  borderRadius: r.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${c.teal.normal}, ${c.teal.deep})`,
  color: c.paper.default,
  fontFamily: recon.font.serif,
  fontSize: fs.xl,
  fontWeight: recon.weight.semibold,
  flexShrink: 0,
})

export const accInfo = style({ display: 'flex', flexDirection: 'column', gap: '0.125rem', minInlineSize: 0 })

export const overline = style({
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: c.ink[5],
})

export const accName = style({
  fontFamily: recon.font.serif,
  fontSize: fs['2xl'],
  fontWeight: recon.weight.medium,
  color: c.ink[1],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export const accMeta = style({ fontFamily: recon.font.mono, fontSize: fs.xs, color: c.ink[4] })

export const balanceBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  paddingInline: sp['3xl'],
  marginInlineStart: 'auto',
  borderInline: `${bw.thin} solid ${c.paper.rule}`,
})

export const balanceVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs['3xl'],
  fontWeight: recon.weight.bold,
  color: c.ink[1],
})

export const accActions = style({ display: 'flex', alignItems: 'center', gap: sp.sm })

export const pill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingInline: sp.lg,
  paddingBlock: sp.sm,
  borderRadius: r.sm,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  color: c.ink[3],
  fontFamily: recon.font.mono,
  fontSize: fs.sm,
})

export const btnPrimary = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingInline: sp.lg,
  paddingBlock: sp.sm,
  borderRadius: r.sm,
  border: 'none',
  background: c.teal.normal,
  color: c.paper.default,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  fontWeight: recon.weight.semibold,
  cursor: 'pointer',
  transition: `background ${recon.tFast}`,
  selectors: {
    '&:hover:not(:disabled)': { background: c.teal.deep },
    '&:disabled': { background: c.ink[6], color: c.paper.default, cursor: 'not-allowed' },
  },
})

export const btnSecondary = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingInline: sp.lg,
  paddingBlock: sp.sm,
  borderRadius: r.sm,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  color: c.ink[2],
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  fontWeight: recon.weight.medium,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': { background: c.paper.warm },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
})

// ── tabs-bar (h ~44px) ──────────────────────────────────────────────────────────
export const tabsBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.xl,
  paddingInline: sp['3xl'],
  background: c.paper.default,
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
})

export const tabs = style({ display: 'flex', gap: sp.sm })

const tabBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingInline: sp.sm,
  paddingBlock: sp.lg,
  border: 'none',
  background: 'transparent',
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  cursor: 'pointer',
  borderBlockEnd: `${bw.thick} solid transparent`,
} as const

export const tab = styleVariants({
  inactive: { ...tabBase, color: c.ink[4] },
  active: {
    ...tabBase,
    color: c.ink[1],
    fontWeight: recon.weight.semibold,
    borderBlockEndColor: c.teal.normal,
  },
})

export const badge = style({
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  paddingInline: sp.xs,
  paddingBlock: '0.0625rem',
  borderRadius: r.pill,
  background: c.paper.beige,
  color: c.ink[3],
})

export const tabsRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp['2xl'],
  marginInlineStart: 'auto',
})

export const progressMini = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[4],
})

export const progressBar = style({
  inlineSize: '5.625rem',
  blockSize: '0.3125rem',
  borderRadius: r.pill,
  background: c.paper.beige,
  overflow: 'hidden',
})

export const progressFill = style({
  blockSize: '100%',
  background: `linear-gradient(90deg, ${c.teal.normal}, ${c.green.normal})`,
  transition: `inline-size ${recon.tMid} ${recon.ease}`,
})

export const progressNum = style({ fontFamily: recon.font.mono, fontSize: fs['2xs'], color: c.ink[3] })

export const toggle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[3],
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
})

const switchAfter = {
  content: '""',
  position: 'absolute',
  insetBlockStart: '0.125rem',
  insetInlineStart: '0.125rem',
  inlineSize: '0.75rem',
  blockSize: '0.75rem',
  borderRadius: r.pill,
  background: c.paper.default,
  transition: `transform ${recon.tFast} ${recon.ease}`,
} as const
const switchBase = {
  position: 'relative',
  inlineSize: '1.75rem',
  blockSize: '1rem',
  borderRadius: r.pill,
  transition: `background ${recon.tFast}`,
  flexShrink: 0,
} as const

export const switchTrack = styleVariants({
  on: {
    ...switchBase,
    background: c.teal.normal,
    '::after': { ...switchAfter, transform: 'translateX(0.75rem)' },
  },
  off: { ...switchBase, background: c.ink[6], '::after': switchAfter },
})

// ── workspace body ──────────────────────────────────────────────────────────────
export const workspace = style({ flex: 1, position: 'relative', background: c.paper.warm })

export const emptyState = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: sp.sm,
  paddingBlock: '3rem',
  paddingInline: sp['3xl'],
  textAlign: 'center',
  color: c.ink[4],
  fontFamily: recon.font.sans,
  fontSize: fs.md,
})

export const noticeChrome = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingInline: sp.sm,
  paddingBlock: '0.25rem',
  borderRadius: r.sm,
  background: c.amber.bg,
  color: c.amber.deep,
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
})

// ── conciliação view (2 colunas: imports 460px | associação) ────────────────────
export const conciliacaoView = style({
  display: 'grid',
  gridTemplateColumns: '28.75rem 1fr',
  minBlockSize: '100%',
})

export const importsCol = style({
  display: 'flex',
  flexDirection: 'column',
  background: c.paper.default,
  borderInlineEnd: `${bw.thin} solid ${c.paper.rule}`,
})

export const importsHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  paddingInline: sp.xl,
  paddingBlock: sp.lg,
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
})

export const filterTabs = style({ display: 'flex', gap: sp.xs, marginInlineStart: 'auto' })

const filterTabBase = {
  border: 'none',
  background: 'transparent',
  paddingInline: sp.sm,
  paddingBlock: '0.25rem',
  borderRadius: r.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  cursor: 'pointer',
} as const

export const filterTab = styleVariants({
  inactive: { ...filterTabBase, color: c.ink[4] },
  active: { ...filterTabBase, color: c.ink[1], fontWeight: recon.weight.semibold, background: c.paper.beige },
})

export const importsList = style({ display: 'flex', flexDirection: 'column', overflowY: 'auto' })

export const dayDivider = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  paddingInline: sp.xl,
  paddingBlock: sp.xs,
  background: c.paper.warm,
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: c.ink[5],
})

const txRowBase = {
  display: 'grid',
  gridTemplateColumns: '2rem 1fr auto',
  gap: sp.md,
  alignItems: 'center',
  inlineSize: '100%',
  textAlign: 'start',
  border: 'none',
  paddingInline: sp.xl,
  paddingBlock: sp.lg,
  background: 'transparent',
  cursor: 'pointer',
  borderInlineStart: `${bw.thick} solid transparent`,
  borderBlockEnd: `${bw.hairline} solid ${c.paper.rule}`,
  transition: `background ${recon.tFast}`,
} as const

export const txRow = styleVariants({
  base: { ...txRowBase, selectors: { '&:hover': { background: c.paper.warm } } },
  selected: { ...txRowBase, background: c.teal.bg, borderInlineStartColor: c.teal.normal },
  reconciled: { ...txRowBase, opacity: 0.62, selectors: { '&:hover': { background: c.paper.warm } } },
})

export const txIcon = style({
  inlineSize: '1.875rem',
  blockSize: '1.875rem',
  borderRadius: r.sm,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

export const txIconKind = styleVariants({
  in: { background: c.green.bg, color: c.green.deep },
  out: { background: c.red.bg, color: c.red.deep },
  transfer: { background: c.purple.bg, color: c.purple.deep },
  fee: { background: c.paper.beige, color: c.ink[3] },
  investment: { background: c.amber.bg, color: c.amber.deep },
})

export const txBody = style({ display: 'flex', flexDirection: 'column', gap: '0.0625rem', minInlineSize: 0 })
export const txDate = style({ fontFamily: recon.font.mono, fontSize: fs['3xs'], color: c.ink[5] })
export const txName = style({
  fontSize: fs.md,
  fontWeight: recon.weight.medium,
  color: c.ink[1],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const txDesc = style({
  fontSize: fs.sm,
  color: c.ink[4],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const txAmtBlock = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.1875rem',
})

export const txAmt = styleVariants({
  in: {
    fontFamily: recon.font.mono,
    fontSize: fs.lg,
    fontWeight: recon.weight.semibold,
    color: c.green.deep,
  },
  out: { fontFamily: recon.font.mono, fontSize: fs.lg, fontWeight: recon.weight.semibold, color: c.red.deep },
})

const tagBase = {
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  paddingInline: sp.sm,
  paddingBlock: '0.0625rem',
  borderRadius: r.pill,
  fontWeight: recon.weight.medium,
} as const
export const txTag = styleVariants({
  pending: { ...tagBase, color: c.orange.deep, background: c.orange.bg },
  reconciled: { ...tagBase, color: c.green.deep, background: c.green.bg },
})

// ── coluna de associação ────────────────────────────────────────────────────────
export const assocCol = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sp.xl,
  padding: sp['3xl'],
  overflowY: 'auto',
  color: c.ink[3],
  fontFamily: recon.font.sans,
  fontSize: fs.md,
})

export const assocTabs = style({
  display: 'flex',
  gap: sp.sm,
  paddingInline: sp['3xl'],
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
})

const assocTabBase = {
  border: 'none',
  background: 'transparent',
  paddingInline: sp.sm,
  paddingBlock: sp.lg,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  cursor: 'pointer',
  borderBlockEnd: `${bw.thick} solid transparent`,
} as const
export const assocTab = styleVariants({
  inactive: { ...assocTabBase, color: c.ink[4] },
  active: {
    ...assocTabBase,
    color: c.ink[1],
    fontWeight: recon.weight.semibold,
    borderBlockEndColor: c.teal.normal,
  },
})

export const matchCard = style({
  border: `${bw.thin} solid ${c.green.line}`,
  borderRadius: r.xl,
  overflow: 'hidden',
  background: c.paper.default,
  boxShadow: `${recon.shadow.card}, 0 0 0 ${bw.ring} ${c.green.bg}`,
})

export const matchHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: sp.sm,
  paddingInline: sp.xl,
  paddingBlock: sp.lg,
  background: c.green.bg,
  color: c.green.deep,
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderBlockEnd: `${bw.thin} solid ${c.green.line}`,
})

export const matchSides = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1.75rem 1fr',
  gap: sp.sm,
  alignItems: 'center',
  padding: sp.xl,
})

const matchSideBase = {
  display: 'flex',
  flexDirection: 'column',
  gap: sp.xs,
  padding: sp.lg,
  borderRadius: r.md,
} as const
export const matchSide = styleVariants({
  extrato: { ...matchSideBase, background: c.paper.warm, border: `${bw.thin} solid ${c.paper.rule}` },
  doc: { ...matchSideBase, background: c.teal.bg, border: `${bw.thin} solid ${c.teal.line}` },
})

export const matchArrow = style({
  color: c.green.normal,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})
export const sideLbl = style({
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: c.ink[5],
})
export const sideTitle = style({ fontSize: fs.md, fontWeight: recon.weight.semibold, color: c.ink[1] })
export const sideRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: sp.sm,
  fontSize: fs.sm,
})
export const sideKey = style({ color: c.ink[5] })
export const sideVal = style({ fontFamily: recon.font.mono, color: c.ink[3] })

export const critList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: sp.xs,
  paddingInline: sp.xl,
  paddingBlockEnd: sp.lg,
})
const critBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  paddingInline: sp.sm,
  paddingBlock: '0.125rem',
  borderRadius: r.sm,
} as const
export const crit = styleVariants({
  ok: { ...critBase, color: c.green.deep, background: c.green.bg },
  warn: { ...critBase, color: c.orange.deep, background: c.orange.bg },
})

export const matchActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  padding: sp.xl,
  background: c.paper.warm,
  borderBlockStart: `${bw.thin} solid ${c.paper.rule}`,
})
export const spacer = style({ flex: 1 })

export const btnConfirm = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingInline: sp.xl,
  paddingBlock: sp.sm,
  borderRadius: r.sm,
  border: 'none',
  background: c.green.deep,
  color: c.paper.default,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  fontWeight: recon.weight.semibold,
  cursor: 'pointer',
  selectors: { '&:disabled': { opacity: 0.5, cursor: 'not-allowed' } },
})

export const altList = style({ display: 'flex', flexDirection: 'column', gap: sp.sm })
export const altCard = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: sp.sm,
  padding: sp.lg,
  borderRadius: r.md,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
})

export const errorText = style({ color: c.red.deep, fontFamily: recon.font.sans, fontSize: fs.sm })
export const summaryNote = style({ color: c.green.deep, fontFamily: recon.font.mono, fontSize: fs['3xs'] })

// ── bottombar (h ~52px) ─────────────────────────────────────────────────────────
export const bottombar = style({
  position: 'fixed',
  insetBlockEnd: 0,
  insetInline: 0,
  display: 'flex',
  alignItems: 'center',
  gap: sp.xl,
  paddingInline: sp['3xl'],
  paddingBlock: sp.lg,
  background: c.paper.default,
  borderBlockStart: `${bw.thin} solid ${c.paper.rule}`,
})

export const auditNote = style({ fontFamily: recon.font.sans, fontSize: fs.sm, color: c.ink[5] })

export const bottomActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  marginInlineStart: 'auto',
})

// ── Buscar / Criar vários (US3) ─────────────────────────────────────────────────
export const multiSummary = style({ display: 'flex', alignItems: 'center', gap: sp.xl, flexWrap: 'wrap' })
export const summaryItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.0625rem',
  minInlineSize: 0,
})
export const summaryLbl = style({ fontFamily: recon.font.sans, fontSize: fs['3xs'], color: c.ink[5] })
export const summaryVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs.xl,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
})
const diffPillBase = {
  marginInlineStart: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.0625rem',
  padding: sp.lg,
  borderRadius: r.md,
} as const
export const diffPill = styleVariants({
  zero: { ...diffPillBase, background: c.green.bg, color: c.green.deep },
  open: { ...diffPillBase, background: c.orange.bg, color: c.orange.deep },
})

export const payGrid = style({
  display: 'flex',
  flexDirection: 'column',
  border: `${bw.thin} solid ${c.paper.rule}`,
  borderRadius: r.md,
  overflow: 'hidden',
})
export const payRow = style({
  display: 'grid',
  gridTemplateColumns: '1.25rem 1fr auto',
  gap: sp.sm,
  alignItems: 'center',
  inlineSize: '100%',
  textAlign: 'start',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  paddingInline: sp.lg,
  paddingBlock: sp.lg,
  borderBlockEnd: `${bw.hairline} solid ${c.paper.rule}`,
  selectors: { '&:hover': { background: c.paper.warm } },
})
export const payRowSelected = style({ background: c.teal.bg })
export const checkbox = styleVariants({
  on: {
    inlineSize: '1rem',
    blockSize: '1rem',
    borderRadius: r.sm,
    background: c.teal.normal,
    border: `${bw.thin} solid ${c.teal.normal}`,
  },
  off: {
    inlineSize: '1rem',
    blockSize: '1rem',
    borderRadius: r.sm,
    background: c.paper.default,
    border: `${bw.thin} solid ${c.ink[6]}`,
  },
})
export const payName = style({
  fontSize: fs.md,
  color: c.ink[1],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const payMeta = style({ fontFamily: recon.font.mono, fontSize: fs['3xs'], color: c.ink[5] })
export const payAmt = style({
  fontFamily: recon.font.mono,
  fontSize: fs.md,
  fontWeight: recon.weight.semibold,
  color: c.ink[2],
})

export const treatmentRow = style({ display: 'flex', flexWrap: 'wrap', gap: sp.xs })
const treatmentCardBase = {
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  borderRadius: r.md,
  paddingInline: sp.lg,
  paddingBlock: sp.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  cursor: 'pointer',
} as const
export const treatmentCard = styleVariants({
  off: { ...treatmentCardBase, color: c.ink[3] },
  on: { ...treatmentCardBase, color: c.orange.deep, background: c.orange.bg, borderColor: c.orange.normal },
})

// ── Nova transação (US4) ────────────────────────────────────────────────────────
export const typeGrid = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.sm })
const typeCardBase = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  borderRadius: r.md,
  padding: sp.lg,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[3],
  cursor: 'pointer',
  textAlign: 'center',
} as const
export const typeCard = styleVariants({
  off: { ...typeCardBase },
  on: { ...typeCardBase, color: c.teal.deep, background: c.teal.bg, borderColor: c.teal.normal },
})
export const formField = style({ display: 'flex', flexDirection: 'column', gap: '0.25rem' })
export const fieldLabel = style({ fontFamily: recon.font.sans, fontSize: fs.sm, color: c.ink[3] })
export const input = style({
  inlineSize: '100%',
  paddingInline: sp.lg,
  paddingBlock: sp.sm,
  borderRadius: r.md,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  color: c.ink[1],
})
export const confirmRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[3],
})
export const warnBox = style({
  display: 'flex',
  gap: sp.sm,
  padding: sp.lg,
  borderRadius: r.md,
  background: c.orange.bg,
  color: c.orange.deep,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
})

// ── Desfazer (US5) ──────────────────────────────────────────────────────────────
export const banner = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sp.lg,
  padding: sp.xl,
  borderRadius: r.xl,
  background: c.green.bg,
  border: `${bw.thin} solid ${c.green.line}`,
})
export const bannerTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.xs,
  color: c.green.deep,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  fontWeight: recon.weight.semibold,
})

// ── Aba Extrato (US8) ───────────────────────────────────────────────────────────
export const extWrap = style({
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: '100%',
  background: c.paper.default,
})
export const extHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  paddingInline: sp['3xl'],
  paddingBlock: sp.lg,
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
})
export const extRows = style({ display: 'flex', flexDirection: 'column', overflowY: 'auto' })
const extGridCols = {
  display: 'grid',
  gridTemplateColumns: '6rem 1fr 7rem 7rem 8rem',
  gap: sp.sm,
  alignItems: 'center',
} as const
export const extRow = style({
  ...extGridCols,
  paddingInline: sp['3xl'],
  paddingBlock: sp.lg,
  borderBlockEnd: `${bw.hairline} solid ${c.paper.rule}`,
})
export const extHeadRow = style({
  ...extGridCols,
  paddingInline: sp['3xl'],
  paddingBlock: sp.lg,
  background: c.paper.warm,
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  color: c.ink[5],
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})
export const extFoot = style({
  ...extGridCols,
  paddingInline: sp['3xl'],
  paddingBlock: sp.lg,
  background: c.paper.warm,
  borderBlockStart: `${bw.thin} solid ${c.paper.rule}`,
  fontFamily: recon.font.mono,
  fontWeight: recon.weight.bold,
})
export const extCellMono = style({ fontFamily: recon.font.mono, fontSize: fs.sm, color: c.ink[3] })
export const extCellMonoRight = style({
  fontFamily: recon.font.mono,
  fontSize: fs.sm,
  textAlign: 'end',
  color: c.ink[3],
})
export const extIn = style({
  fontFamily: recon.font.mono,
  fontSize: fs.sm,
  textAlign: 'end',
  color: c.green.deep,
})
export const extOut = style({
  fontFamily: recon.font.mono,
  fontSize: fs.sm,
  textAlign: 'end',
  color: c.red.deep,
})
export const extName = style({
  fontSize: fs.md,
  color: c.ink[1],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
