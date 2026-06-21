/**
 * Workspace de Conciliação — estilos (vanilla-extract). **Fidelidade ao mock** `conciliacao_bancaria`
 * via a camada de tokens do módulo (`recon.values.ts`, espelha o `:root` da consultoria — teal/paper/ink/
 * Fraunces). Mantém TODOS os nomes de export consumidos pela page/componentes. §X: zero literal cru aqui
 * (tudo via `recon.*`).
 */
import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { recon } from '../../recon-ui/recon.values.ts'

const pulse = keyframes({
  '0%': { transform: 'scale(0.6)', opacity: 0.6 },
  '100%': { transform: 'scale(1.6)', opacity: 0 },
})

const c = recon.color
const sp = recon.space
const fs = recon.size
const r = recon.radius
const bw = recon.border

// Scrollbar suave (fina + bege clara) — espalhada nos containers roláveis do módulo (extrato/listas).
// Padrão (Firefox/modern) + WebKit. Trilho transparente; polegar bege claro com cantos arredondados.
const scrollSoft = {
  scrollbarWidth: 'thin',
  scrollbarColor: `${c.paper.rule} transparent`,
  '::-webkit-scrollbar': { width: '0.375rem', height: '0.375rem' },
  '::-webkit-scrollbar-track': { background: 'transparent' },
  '::-webkit-scrollbar-thumb': { background: c.paper.rule, borderRadius: r.pill },
  '::-webkit-scrollbar-thumb:hover': { background: c.ink[6] },
} as const

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100%',
  overflow: 'hidden', // altura limitada: header/tabs/footer fixos; só o corpo (extrato/conciliação) rola
  background: c.paper.warm,
  color: c.ink[2],
})

// ── acc-header (hero, fiel ao mock: identidade | saldo | ações) ──────────────────
export const accHeader = style({
  flexShrink: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(21.25rem, auto) 1fr auto',
  alignItems: 'center',
  gap: '2.25rem',
  paddingInline: sp['3xl'],
  paddingBlock: sp.lg,
  background: c.paper.default,
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
})

export const accId = style({ display: 'flex', alignItems: 'center', gap: sp.xl, minInlineSize: 0 })

export const bankMark = style({
  inlineSize: '2.75rem',
  blockSize: '2.75rem',
  borderRadius: r.lg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${c.teal.normal}, ${c.teal.deep})`,
  color: c.paper.default,
  fontFamily: recon.font.sans,
  fontSize: fs.xl,
  fontWeight: recon.weight.semibold,
  letterSpacing: '-0.02em',
  flexShrink: 0,
})

export const accInfo = style({ display: 'flex', flexDirection: 'column', gap: '0.125rem', minInlineSize: 0 })

export const overline = style({
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontWeight: recon.weight.semibold,
  color: c.ink[5],
})

export const accName = style({
  fontFamily: recon.font.sans,
  fontSize: fs['2xl'],
  fontWeight: recon.weight.medium,
  color: c.ink[1],
  lineHeight: 1.15,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export const accMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  marginBlockStart: '0.0625rem',
  fontFamily: recon.font.mono,
  fontSize: fs.xs,
  color: c.ink[4],
})
export const accMetaDot = style({ color: c.ink[6] })
export const changeAcc = style({
  marginInlineStart: sp.xs,
  paddingInline: '0.5625rem',
  paddingBlock: '0.25rem',
  borderRadius: r.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.xs,
  fontWeight: recon.weight.medium,
  color: c.teal.deep,
  background: c.paper.default,
  border: `${bw.hairline} solid ${c.teal.line}`,
  cursor: 'pointer',
  selectors: { '&:hover': { background: c.teal.bg } },
})

export const balanceBlock = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.125rem',
  paddingInline: '1.75rem',
  borderInline: `${bw.thin} solid ${c.paper.rule}`,
})
export const balanceLbl = style({
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: c.ink[5],
})
export const balanceVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs['3xl'],
  fontWeight: recon.weight.bold,
  color: c.ink[1],
  lineHeight: 1.1,
  fontVariantNumeric: 'tabular-nums',
})
export const balanceCents = style({ fontSize: fs['2xl'], fontWeight: recon.weight.semibold, color: c.ink[3] })
export const balanceUpd = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  marginBlockStart: '0.125rem',
  fontFamily: recon.font.mono,
  fontSize: fs['2xs'],
  color: c.ink[5],
})
export const pulseDot = style({
  position: 'relative',
  inlineSize: '0.375rem',
  blockSize: '0.375rem',
  borderRadius: r.pill,
  background: c.green.normal,
  '::before': {
    content: '""',
    position: 'absolute',
    inset: '-0.1875rem',
    borderRadius: r.pill,
    border: `${bw.thick} solid ${c.green.normal}`,
    opacity: 0.5,
    animation: `${pulse} 2s ${recon.ease} infinite`,
  },
})

export const accActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  justifyContent: 'flex-end',
})
export const periodBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  boxSizing: 'border-box',
  blockSize: '2.375rem', // mesma altura do botão Importar (proporcional)
  paddingInline: sp.lg,
  borderRadius: r.md,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  color: c.ink[3],
  fontFamily: recon.font.mono,
  fontSize: fs.sm,
  cursor: 'pointer',
})
export const periodLbl = style({
  fontWeight: recon.weight.semibold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: c.ink[5],
})
export const periodValue = style({ color: c.ink[1], fontWeight: recon.weight.medium })
export const periodChev = style({ color: c.ink[5], display: 'inline-flex' })
export const guessesHint = style({ fontFamily: recon.font.mono, fontSize: fs['3xs'], color: c.ink[5] })

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
  boxSizing: 'border-box',
  blockSize: '2.375rem', // mesma altura do botão Período (proporcional)
  paddingInline: sp.lg,
  borderRadius: r.md,
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
  boxSizing: 'border-box',
  blockSize: '2.375rem',
  paddingInline: sp.lg,
  borderRadius: r.md,
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
  flexShrink: 0,
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
export const workspace = style({
  flex: 1,
  minBlockSize: 0,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  background: c.paper.warm,
})

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
  flex: 1,
  minBlockSize: 0,
  display: 'grid',
  gridTemplateColumns: '28.75rem 1fr',
})

export const importsCol = style({
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: 0,
  overflow: 'hidden',
  background: c.paper.default,
  borderInlineEnd: `${bw.thin} solid ${c.paper.rule}`,
})

export const importsHead = style({
  flexShrink: 0,
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

export const importsList = style({
  flex: 1,
  minBlockSize: 0,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  ...scrollSoft,
})

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

// #174: palpite de topo por linha (gated por "Exibir palpites") — ponto colorido por banda + score%.
export const rowGuess = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  color: c.ink[4],
})
const guessDotBase = {
  inlineSize: '0.5rem',
  blockSize: '0.5rem',
  borderRadius: r.pill,
  flexShrink: 0,
} as const
export const rowGuessDot = styleVariants({
  alta: { ...guessDotBase, background: c.green.normal },
  media: { ...guessDotBase, background: c.orange.normal },
})

// ── coluna de associação ────────────────────────────────────────────────────────
export const assocCol = style({
  flex: 1,
  minBlockSize: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: sp.xl,
  padding: sp['3xl'],
  overflowY: 'auto',
  color: c.ink[3],
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  ...scrollSoft,
})

export const assocTabs = style({
  flexShrink: 0,
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
  // #140: critério não atendido — neutro/apagado (não alarmante como o vermelho de erro).
  falha: { ...critBase, color: c.ink[5], background: c.paper.beige },
})
// #140: peso do critério (badge minúsculo dentro do chip), tom apagado p/ não competir com o rótulo.
export const critWeight = style({ fontFamily: recon.font.mono, opacity: 0.6 })

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

// ── Outras possibilidades (alt-cards) — fiel ao mock ────────────────────────────
export const altList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sp.xs,
  marginBlockStart: sp['2xl'],
})
export const altOverline = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.md,
  marginBlockEnd: '0.125rem',
  fontFamily: recon.font.sans,
  fontSize: '0.59375rem',
  fontWeight: recon.weight.bold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: c.ink[5],
  selectors: { '&::after': { content: '""', flex: 1, blockSize: bw.hairline, background: c.paper.rule } },
})
export const altCard = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto auto',
  gap: sp.xl,
  alignItems: 'center',
  paddingBlock: sp.md,
  paddingInline: sp.xl,
  background: c.paper.default,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  borderRadius: r.md,
  transition: `background ${recon.tFast}, border-color ${recon.tFast}`,
  selectors: { '&:hover': { borderColor: c.teal.line, background: c.teal.bg } },
})
export const altInfo = style({ minInlineSize: 0 })
export const altNm = style({
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  fontWeight: recon.weight.semibold,
  color: c.ink[1],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const altMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  marginBlockStart: '0.125rem',
  minInlineSize: 0,
})
export const altDocRef = style({
  fontFamily: recon.font.mono,
  fontSize: fs['2xs'],
  color: c.ink[5],
  whiteSpace: 'nowrap',
})
const altStatusBase = {
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  paddingBlock: '0.0625rem',
  paddingInline: sp.xs,
  borderRadius: '0.1875rem',
  whiteSpace: 'nowrap',
} as const
export const altStatusMini = styleVariants({
  pago: { ...altStatusBase, background: c.green.bg, color: c.green.deep },
  aprovado: { ...altStatusBase, background: c.teal.bg, color: c.teal.deep },
})
export const altConfMini = style({
  fontFamily: recon.font.mono,
  fontSize: fs['2xs'],
  fontWeight: recon.weight.semibold,
  color: c.ink[4],
  whiteSpace: 'nowrap',
})
export const altAmt = style({
  fontFamily: recon.font.mono,
  fontSize: fs.md,
  fontWeight: recon.weight.semibold,
  color: c.ink[2],
  whiteSpace: 'nowrap',
})
export const altBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBlock: '0.3125rem',
  paddingInline: sp.md,
  borderRadius: r.sm,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  background: c.paper.default,
  color: c.ink[2],
  fontFamily: recon.font.sans,
  fontSize: fs.xs,
  fontWeight: recon.weight.medium,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: `background ${recon.tFast}, border-color ${recon.tFast}`,
  selectors: {
    '&:hover:not(:disabled)': { background: c.paper.warm, borderColor: c.ink[6] },
    '&:disabled': { color: c.ink[6], cursor: 'not-allowed' },
  },
})

export const errorText = style({ color: c.red.deep, fontFamily: recon.font.sans, fontSize: fs.sm })
export const summaryNote = style({ color: c.green.deep, fontFamily: recon.font.mono, fontSize: fs['3xs'] })

// ── bottombar (h ~52px) ─────────────────────────────────────────────────────────
export const bottombar = style({
  flexShrink: 0,
  blockSize: '3.5rem', // mesma espessura do footer da tela de lançar contrato (altura fixa)
  display: 'flex',
  alignItems: 'center',
  gap: sp.xl,
  paddingInline: sp['3xl'],
  background: c.paper.default,
  borderBlockStart: `${bw.thin} solid ${c.paper.rule}`,
})

// legenda (esquerda do footer): pontos coloridos + rótulos, fiel ao mock
export const legend = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.lg,
  flexWrap: 'wrap',
  minInlineSize: 0,
})
export const legendItem = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[3],
  whiteSpace: 'nowrap',
})
const legendDotBase = {
  inlineSize: '0.5rem',
  blockSize: '0.5rem',
  borderRadius: r.pill,
  flexShrink: 0,
} as const
export const legendDot = styleVariants({
  alta: { ...legendDotBase, background: c.green.normal },
  parcial: { ...legendDotBase, background: c.orange.normal },
  semMatch: { ...legendDotBase, background: c.ink[6] },
  conciliado: { ...legendDotBase, background: c.green.deep },
})
export const legendSep = style({
  inlineSize: bw.thin,
  blockSize: '0.875rem',
  background: c.paper.rule,
  flexShrink: 0,
})

export const auditNote = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[5],
})
export const auditDot = style({
  inlineSize: '0.5rem',
  blockSize: '0.5rem',
  borderRadius: r.pill,
  background: c.green.normal,
  flexShrink: 0,
})

export const bottomActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  marginInlineStart: 'auto',
  flexShrink: 0,
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

// ── Nova transação (US4) — formulário fiel ao mock (campos por tipo) ─────────────
export const ntForm = style({
  background: c.paper.default,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  borderRadius: '0.75rem',
  paddingBlock: '1.125rem 1.25rem',
  paddingInline: '1.25rem',
})
export const ntSection = style({
  marginBlockEnd: sp['2xl'],
  selectors: { '&:last-child': { marginBlockEnd: 0 } },
})
export const ntSectionLbl = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.md,
  marginBlockEnd: sp.md,
  fontFamily: recon.font.sans,
  fontSize: '0.59375rem',
  fontWeight: recon.weight.bold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: c.ink[5],
  selectors: { '&::after': { content: '""', flex: 1, blockSize: bw.hairline, background: c.paper.rule } },
})
export const ntTypeGrid = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.sm })
const ntCardBase = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: sp.xs,
  paddingBlock: sp.lg,
  paddingInline: sp.sm,
  background: c.paper.default,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  borderRadius: r.md,
  cursor: 'pointer',
  textAlign: 'center',
  transition: `background ${recon.tFast}, border-color ${recon.tFast}, box-shadow ${recon.tFast}`,
} as const
export const ntCard = styleVariants({
  off: { ...ntCardBase, selectors: { '&:hover': { borderColor: c.teal.line, background: c.teal.bg } } },
  on: {
    ...ntCardBase,
    borderColor: c.teal.normal,
    background: c.teal.bg,
    boxShadow: `0 0 0 ${bw.ring} ${c.teal.bg}`,
  },
})
const ntCardIcBase = {
  inlineSize: '1.75rem',
  blockSize: '1.75rem',
  borderRadius: r.sm,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
} as const
export const ntCardIc = styleVariants({
  off: { ...ntCardIcBase, background: c.paper.warm, color: c.ink[4] },
  on: { ...ntCardIcBase, background: c.paper.default, color: c.teal.deep },
})
export const ntCardName = styleVariants({
  off: {
    fontFamily: recon.font.sans,
    fontSize: fs.sm,
    fontWeight: recon.weight.medium,
    color: c.ink[2],
    lineHeight: 1.25,
  },
  on: {
    fontFamily: recon.font.sans,
    fontSize: fs.sm,
    fontWeight: recon.weight.semibold,
    color: c.teal.deep,
    lineHeight: 1.25,
  },
})
export const ntCardBadge = style({
  position: 'absolute',
  insetBlockStart: '0.25rem',
  insetInlineEnd: '0.25rem',
  inlineSize: '0.875rem',
  blockSize: '0.875rem',
  borderRadius: r.pill,
  background: c.orange.normal,
  color: c.paper.default,
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})
export const ntRow = style({ display: 'grid', gap: sp.lg, marginBlockEnd: sp.lg })
export const ntRowCols2 = style({ gridTemplateColumns: '1fr 1fr' })
export const ntField = style({ display: 'flex', flexDirection: 'column', gap: '0.3125rem', minInlineSize: 0 })
export const ntLabel = style({
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: c.ink[5],
})
export const ntOpt = style({
  color: c.ink[6],
  fontWeight: recon.weight.medium,
  letterSpacing: 0,
  textTransform: 'none',
  fontSize: fs['2xs'],
})
const ntControlBase = {
  inlineSize: '100%',
  border: `${bw.thin} solid ${c.paper.rule}`,
  borderRadius: r.sm,
  paddingBlock: sp.sm,
  paddingInline: '0.6875rem',
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  color: c.ink[1],
  background: c.paper.default,
  outline: 'none',
  transition: `box-shadow ${recon.tFast}, border-color ${recon.tFast}`,
  selectors: {
    '&:focus': { borderColor: c.teal.normal, boxShadow: `0 0 0 ${bw.ring} ${c.teal.bg}` },
    '&:disabled': { background: c.paper.warm, color: c.ink[5], cursor: 'not-allowed' },
    '&::placeholder': { color: c.ink[5] },
  },
} as const
export const ntInput = style(ntControlBase)
export const ntInputMono = style({ ...ntControlBase, fontFamily: recon.font.mono })
export const ntSelect = style(ntControlBase)
export const ntTextarea = style({ ...ntControlBase, minBlockSize: '3.75rem', resize: 'vertical' })
export const ntWarn = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: sp.md,
  paddingBlock: '0.6875rem',
  paddingInline: sp.xl,
  marginBlockEnd: sp.xl,
  background: c.orange.bg,
  border: `${bw.hairline} solid ${c.orange.line}`,
  borderRadius: r.md,
})
export const ntWarnIc = style({
  color: c.orange.deep,
  flexShrink: 0,
  display: 'inline-flex',
  marginBlockStart: '0.0625rem',
})
export const ntWarnTxt = style({
  fontFamily: recon.font.sans,
  fontSize: '0.71875rem',
  color: c.orange.deep,
  lineHeight: 1.45,
})
export const ntConfirm = style({
  marginBlockStart: sp.xs,
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  border: 'none',
  background: 'transparent',
  padding: 0,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  fontWeight: recon.weight.semibold,
  color: c.orange.deep,
  cursor: 'pointer',
})
const ntConfirmCbBase = {
  inlineSize: '0.8125rem',
  blockSize: '0.8125rem',
  border: `${bw.thick} solid ${c.orange.normal}`,
  borderRadius: '0.1875rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  color: c.paper.default,
} as const
export const ntConfirmCb = styleVariants({
  off: { ...ntConfirmCbBase, background: 'transparent' },
  on: { ...ntConfirmCbBase, background: c.orange.normal },
})
export const ntActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  marginBlockStart: sp['2xl'],
  paddingBlockStart: sp.lg,
  borderBlockStart: `${bw.hairline} solid ${c.paper.rule}`,
})
export const ntCancel = style({
  border: 'none',
  background: 'transparent',
  color: c.ink[4],
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  cursor: 'pointer',
  paddingBlock: sp.sm,
  paddingInline: sp.lg,
  borderRadius: r.sm,
  selectors: { '&:hover': { background: c.paper.warm, color: c.ink[2] } },
})
export const ntHint = style({
  fontFamily: recon.font.sans,
  fontSize: fs['2xs'],
  color: c.ink[5],
  marginBlockEnd: sp.lg,
})

// ── Buscar / Criar vários (US3) — fiel ao mock (resumo, busca, grid, diferença) ──
export const pmSummary = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: sp['2xl'],
  alignItems: 'center',
  paddingBlock: '0.875rem',
  paddingInline: '1.125rem',
  background: c.paper.default,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  borderRadius: '0.75rem',
  marginBlockEnd: '0.875rem',
})
export const pmSummaryLeft = style({ display: 'flex', alignItems: 'center', gap: sp.xl })
export const pmSummaryLbl = style({
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: c.ink[5],
})
export const pmExtrato = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  paddingInlineEnd: sp.xl,
  borderInlineEnd: `${bw.hairline} solid ${c.paper.rule}`,
})
export const pmExtratoVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs.xl,
  fontWeight: recon.weight.bold,
  color: c.red.deep,
  fontVariantNumeric: 'tabular-nums',
})
export const pmSel = style({ display: 'flex', flexDirection: 'column', gap: '0.125rem' })
export const pmSelVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs.xl,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
  fontVariantNumeric: 'tabular-nums',
})
const pmDiffBase = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  paddingBlock: sp.md,
  paddingInline: sp.xl,
  borderRadius: r.md,
} as const
export const pmDiff = styleVariants({
  zero: { ...pmDiffBase, background: c.green.bg, color: c.green.deep },
  error: { ...pmDiffBase, background: c.red.bg, color: c.red.deep },
})
export const pmDiffLbl = style({
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
})
export const pmDiffVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs.lg,
  fontWeight: recon.weight.bold,
})

export const pmSearchBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  marginBlockEnd: sp.md,
  padding: '0.25rem',
  background: c.paper.default,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  borderRadius: r.md,
})
export const pmSearchInput = style({
  flex: 1,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  minInlineSize: 0,
})
export const pmSearchIcon = style({
  position: 'absolute',
  insetInlineStart: '0.625rem',
  display: 'inline-flex',
  color: c.ink[5],
  pointerEvents: 'none',
})
export const pmSearchField = style({
  inlineSize: '100%',
  border: 'none',
  background: 'transparent',
  paddingBlock: sp.sm,
  paddingInlineStart: '1.875rem',
  paddingInlineEnd: sp.md,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  color: c.ink[1],
  outline: 'none',
  selectors: { '&::placeholder': { color: c.ink[5] } },
})
const pmMiniBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingBlock: '0.3125rem',
  paddingInline: '0.5625rem',
  borderRadius: '0.3125rem',
  background: c.paper.warm,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  fontFamily: recon.font.sans,
  fontSize: fs.xs,
  fontWeight: recon.weight.medium,
  color: c.ink[3],
  whiteSpace: 'nowrap',
} as const
export const pmMiniFlt = style({
  ...pmMiniBase,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': { background: c.paper.default, borderColor: c.ink[6] },
    '&:disabled': { cursor: 'not-allowed', opacity: 0.7 },
  },
})
export const pmMiniSelWrap = style(pmMiniBase)
export const pmMiniLbl = style({
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: c.ink[5],
})
export const pmMiniSelect = style({
  border: 'none',
  background: 'transparent',
  fontFamily: recon.font.sans,
  fontSize: fs.xs,
  fontWeight: recon.weight.medium,
  color: c.ink[3],
  cursor: 'pointer',
  outline: 'none',
})
export const pmMiniChev = style({ color: c.teal.normal, fontSize: fs['3xs'] })

export const pmGrid = style({
  background: c.paper.default,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  borderRadius: r.lg,
  overflow: 'hidden',
})
const pmGridCols = {
  display: 'grid',
  gridTemplateColumns: '1.75rem 4.375rem 4.5rem minmax(0, 1.5fr) minmax(0, 1fr) 5.9375rem',
  alignItems: 'center',
  gap: sp.md,
  paddingInline: '0.875rem',
} as const
export const pmGridHead = style({
  ...pmGridCols,
  blockSize: '2rem',
  background: c.paper.warm,
  borderBlockEnd: `${bw.hairline} solid ${c.paper.rule}`,
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: c.ink[5],
})
export const pmRight = style({ textAlign: 'end', justifySelf: 'end' })
export const pmRows = style({ maxBlockSize: '24rem', overflowY: 'auto', ...scrollSoft })
const pmRowBase = {
  ...pmGridCols,
  blockSize: '2.75rem',
  inlineSize: '100%',
  border: 'none',
  borderBlockEnd: `${bw.hairline} solid ${c.paper.rule}`,
  background: 'transparent',
  textAlign: 'start',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: fs.md,
  cursor: 'pointer',
  transition: `background ${recon.tFast}`,
} as const
export const pmRow = styleVariants({
  off: { ...pmRowBase, selectors: { '&:hover': { background: c.paper.warm } } },
  checked: { ...pmRowBase, background: c.teal.bg, selectors: { '&:hover': { background: c.teal.bg2 } } },
})
const pmCbBase = {
  inlineSize: '0.9375rem',
  blockSize: '0.9375rem',
  border: `${bw.thick} solid ${c.ink[6]}`,
  borderRadius: '0.1875rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: fs['2xs'],
  fontWeight: recon.weight.bold,
  color: c.paper.default,
} as const
export const pmCb = styleVariants({
  off: { ...pmCbBase, background: c.paper.default },
  on: { ...pmCbBase, background: c.teal.normal, borderColor: c.teal.normal },
})
export const pmDt = style({ fontFamily: recon.font.mono, fontSize: fs.xs, color: c.ink[3] })
export const pmStatus = style({
  justifySelf: 'start',
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  paddingBlock: '0.125rem',
  paddingInline: sp.xs,
  borderRadius: '0.1875rem',
  whiteSpace: 'nowrap',
  background: c.green.bg,
  color: c.green.deep,
})
export const pmNmCell = style({ minInlineSize: 0 })
export const pmNm = style({
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  fontWeight: recon.weight.medium,
  color: c.ink[1],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const pmDocRef = style({
  fontFamily: recon.font.mono,
  fontSize: fs['2xs'],
  color: c.ink[5],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const pmCat = style({
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[4],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const pmAmt = style({
  fontFamily: recon.font.mono,
  fontSize: fs.md,
  fontWeight: recon.weight.semibold,
  color: c.ink[2],
  textAlign: 'end',
  justifySelf: 'end',
})
export const pmFoot = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.xl,
  paddingBlock: '0.5625rem',
  paddingInline: '0.875rem',
  background: c.paper.warm,
  borderBlockStart: `${bw.hairline} solid ${c.paper.rule}`,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[4],
})
export const pmFootCount = style({
  fontFamily: recon.font.mono,
  fontSize: fs.sm,
  fontWeight: recon.weight.semibold,
  color: c.teal.deep,
})
export const pmFootTotal = style({
  marginInlineStart: 'auto',
  fontFamily: recon.font.mono,
  fontSize: fs.md,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
})

export const pmCreateNew = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  paddingBlock: sp.md,
  paddingInline: '0.875rem',
  marginBlockStart: sp.md,
  background: c.teal.bg,
  border: `${bw.hairline} dashed ${c.teal.line}`,
  borderRadius: r.md,
  color: c.teal.deep,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  fontWeight: recon.weight.medium,
  cursor: 'pointer',
  inlineSize: '100%',
  textAlign: 'start',
  selectors: { '&:hover': { background: c.teal.bg2 } },
})

// Tratamento da diferença (conciliação parcial)
export const diffTreat = style({
  marginBlockStart: '0.875rem',
  paddingBlock: '1rem 1.125rem',
  paddingInline: '1.125rem',
  background: `linear-gradient(180deg, ${c.orange.bg} 0%, ${c.paper.default} 60%)`,
  border: `${bw.hairline} solid ${c.orange.line}`,
  borderRadius: '0.75rem',
})
export const dtHead = style({ display: 'flex', alignItems: 'center', gap: sp.md, marginBlockEnd: sp.md })
export const dtHeadIc = style({ color: c.orange.deep, display: 'inline-flex' })
export const dtLbl = style({
  fontFamily: recon.font.sans,
  fontSize: fs['2xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: c.orange.deep,
})
export const dtAmt = style({
  marginInlineStart: 'auto',
  fontFamily: recon.font.mono,
  fontSize: fs.lg,
  fontWeight: recon.weight.bold,
  color: c.orange.deep,
})
export const dtExplain = style({
  fontFamily: recon.font.sans,
  fontSize: '0.71875rem',
  color: c.ink[3],
  lineHeight: 1.5,
  marginBlockEnd: sp.xl,
})
export const diffTypes = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: sp.xs,
  marginBlockEnd: '0.25rem',
})
const diffCardBase = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.3125rem',
  paddingBlock: sp.md,
  paddingInline: '0.25rem',
  background: c.paper.default,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  borderRadius: '0.4375rem',
  cursor: 'pointer',
  textAlign: 'center',
  transition: `background ${recon.tFast}, border-color ${recon.tFast}, box-shadow ${recon.tFast}`,
} as const
export const diffTypeCard = styleVariants({
  off: { ...diffCardBase, selectors: { '&:hover': { borderColor: c.orange.line, background: c.orange.bg } } },
  on: {
    ...diffCardBase,
    borderColor: c.orange.normal,
    background: c.orange.bg,
    boxShadow: `0 0 0 ${bw.thick} ${c.orange.bg}`,
  },
})
const dtcIcBase = {
  inlineSize: '1.5rem',
  blockSize: '1.5rem',
  borderRadius: r.sm,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const
export const dtcIc = styleVariants({
  off: { ...dtcIcBase, background: c.paper.warm, color: c.ink[4] },
  on: { ...dtcIcBase, background: c.paper.default, color: c.orange.deep },
})
export const dtcName = styleVariants({
  off: { fontFamily: recon.font.sans, fontSize: fs.xs, fontWeight: recon.weight.medium, color: c.ink[2] },
  on: {
    fontFamily: recon.font.sans,
    fontSize: fs.xs,
    fontWeight: recon.weight.semibold,
    color: c.orange.deep,
  },
})
export const diffExtras = style({
  paddingBlockStart: sp.xl,
  marginBlockStart: sp.xl,
  borderBlockStart: `${bw.hairline} solid ${c.paper.rule}`,
})

// ── Dropdowns do header/footer (Período, Exportar) — fiel ao mock ────────────────
export const ddWrap = style({ position: 'relative', display: 'inline-flex' })
export const ddBackdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 29,
  border: 'none',
  background: 'transparent',
  cursor: 'default',
})
const ddMenuBase = {
  position: 'absolute',
  zIndex: 30,
  background: c.paper.default,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  borderRadius: r.lg,
  boxShadow: recon.shadow.menu,
  padding: '0.375rem',
} as const
export const periodMenu = style({
  ...ddMenuBase,
  insetBlockStart: 'calc(100% + 0.375rem)',
  insetInlineStart: 0,
  minInlineSize: '16.25rem',
})
export const exportMenu = style({
  ...ddMenuBase,
  insetBlockEnd: 'calc(100% + 0.375rem)', // abre p/ cima (footer)
  insetInlineStart: 0,
  minInlineSize: '17.5rem',
})

const pmItemBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: sp.lg,
  inlineSize: '100%',
  position: 'relative',
  border: 'none',
  background: 'transparent',
  textAlign: 'start',
  paddingBlock: sp.sm,
  paddingInlineEnd: sp.xl,
  paddingInlineStart: '1.375rem',
  borderRadius: r.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  fontWeight: recon.weight.medium,
  cursor: 'pointer',
  transition: `background ${recon.tFast}`,
} as const
export const periodItem = styleVariants({
  off: { ...pmItemBase, color: c.ink[1], selectors: { '&:hover': { background: c.teal.bg } } },
  on: {
    ...pmItemBase,
    color: c.teal.deep,
    fontWeight: recon.weight.semibold,
    background: c.teal.bg,
    selectors: {
      '&::before': {
        content: '""',
        position: 'absolute',
        insetInlineStart: '0.5rem',
        insetBlockStart: '50%',
        transform: 'translateY(-50%)',
        inlineSize: '0.375rem',
        blockSize: '0.375rem',
        borderRadius: r.pill,
        background: c.teal.normal,
      },
    },
  },
})
export const periodOptMeta = styleVariants({
  off: { fontFamily: recon.font.mono, fontSize: fs.xs, fontWeight: recon.weight.medium, color: c.ink[5] },
  on: { fontFamily: recon.font.mono, fontSize: fs.xs, fontWeight: recon.weight.medium, color: c.teal.deep },
})
export const pmDivider = style({
  blockSize: bw.hairline,
  background: c.paper.rule,
  marginBlock: '0.25rem',
  marginInline: '0.375rem',
})

// Personalizado: linha com os dois campos de data (calendário nativo) dentro do menu de período.
export const periodCustomRow = style({
  display: 'flex',
  gap: sp.sm,
  paddingInline: '0.625rem',
  paddingBlock: sp.sm,
})
export const periodCustomField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1875rem',
  flex: 1,
})
export const periodCustomLbl = style({
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: c.ink[5],
})
export const periodCustomInput = style({
  fontFamily: recon.font.mono,
  fontSize: fs.xs,
  color: c.ink[2],
  background: c.paper.default,
  border: `${bw.thin} solid ${c.paper.rule}`,
  borderRadius: r.sm,
  paddingInline: sp.sm,
  paddingBlock: '0.3125rem',
  selectors: { '&:focus': { outline: 'none', borderColor: c.teal.normal } },
})

// menu de itens (Exportar / Importar) — grupo + item com ícone
export const ddGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.md,
  paddingBlock: '0.625rem 0.375rem',
  paddingInline: sp.md,
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: c.ink[5],
  selectors: { '&::after': { content: '""', flex: 1, blockSize: bw.hairline, background: c.paper.rule } },
})
const ddItemBase = {
  display: 'flex',
  alignItems: 'center',
  gap: sp.md,
  inlineSize: '100%',
  paddingBlock: sp.sm,
  paddingInline: sp.md,
  borderRadius: r.sm,
  border: 'none',
  background: 'transparent',
  textAlign: 'start',
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  color: c.ink[1],
  transition: `background ${recon.tFast}`,
} as const
export const ddItem = styleVariants({
  on: { ...ddItemBase, cursor: 'pointer', selectors: { '&:hover': { background: c.teal.bg } } },
  off: { ...ddItemBase, cursor: 'not-allowed', opacity: 0.6 },
})
export const ddItemIc = style({
  inlineSize: '1.625rem',
  blockSize: '1.625rem',
  borderRadius: r.sm,
  background: c.paper.warm,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: c.ink[4],
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  flexShrink: 0,
})
export const ddItemLbl = style({ flex: 1, fontWeight: recon.weight.medium })
export const ddItemHint = style({ fontFamily: recon.font.sans, fontSize: fs['2xs'], color: c.ink[5] })
export const periodChevOpen = style({ color: c.ink[5], display: 'inline-flex', transform: 'rotate(180deg)' })

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

// ── Aba Extrato (US8) — fiel ao mock (9 colunas, divisor de dia, conc-mark, footer) ──
export const extWrap = style({
  flex: 1,
  minBlockSize: 0,
  display: 'flex',
  flexDirection: 'column',
  background: c.paper.default,
})
export const extHead = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: sp.lg,
  paddingInline: sp['3xl'],
  paddingBlock: sp.lg,
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
})
export const extHeadOverline = style({
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: c.ink[5],
})
export const extCount = style({
  fontFamily: recon.font.mono,
  fontSize: fs.xs,
  fontWeight: recon.weight.semibold,
  color: c.ink[3],
})
export const extRows = style({
  flex: 1,
  minBlockSize: 0,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  ...scrollSoft,
})

const extGridCols = {
  display: 'grid',
  gridTemplateColumns:
    '1.75rem 3.75rem 5rem minmax(11.25rem, 13.75rem) minmax(0, 1fr) 9.375rem 6.875rem 6.875rem 8.125rem',
  alignItems: 'center',
  gap: sp.lg,
  paddingInline: sp['3xl'],
} as const

export const extGridHead = style({
  ...extGridCols,
  flexShrink: 0,
  blockSize: '2rem',
  background: c.paper.warm,
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: c.ink[5],
})
export const extRight = style({ textAlign: 'end', justifySelf: 'end' })

const extRowBase = {
  ...extGridCols,
  blockSize: '2.875rem',
  inlineSize: '100%',
  border: 'none',
  borderBlockEnd: `${bw.hairline} solid ${c.paper.rule}`,
  background: 'transparent',
  textAlign: 'start',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: fs.md,
  cursor: 'pointer',
  transition: `background ${recon.tFast}`,
} as const
export const extRow = styleVariants({
  base: { ...extRowBase, selectors: { '&:hover': { background: c.paper.warm } } },
  reconciled: {
    ...extRowBase,
    opacity: 0.72,
    selectors: { '&:hover': { opacity: 0.92, background: c.paper.warm } },
  },
})

export const concMark = styleVariants({
  pending: {
    inlineSize: '1.125rem',
    blockSize: '1.125rem',
    borderRadius: r.pill,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '::after': {
      content: '""',
      inlineSize: '0.375rem',
      blockSize: '0.375rem',
      borderRadius: r.pill,
      background: c.orange.normal,
    },
  },
  reconciled: {
    inlineSize: '1.125rem',
    blockSize: '1.125rem',
    borderRadius: r.pill,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: c.green.bg,
    color: c.green.deep,
  },
})

export const extDt = style({ fontFamily: recon.font.mono, fontSize: fs.sm, color: c.ink[3] })

const extKindBase = {
  fontFamily: recon.font.sans,
  fontSize: '0.53125rem',
  fontWeight: recon.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  paddingInline: sp.xs,
  paddingBlock: '0.125rem',
  borderRadius: r.sm,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  justifySelf: 'start',
} as const
export const extKind = styleVariants({
  pix: { ...extKindBase, background: c.pix.bg, color: c.pix.text },
  ted: { ...extKindBase, background: c.teal.bg, color: c.teal.deep },
  doc: { ...extKindBase, background: c.amber.bg, color: c.amber.deep },
  tar: { ...extKindBase, background: c.paper.beige, color: c.ink[3] },
  apl: { ...extKindBase, background: c.purple.bg, color: c.purple.deep },
  default: { ...extKindBase, background: c.paper.beige, color: c.ink[3] },
})

export const extName = style({
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  fontWeight: recon.weight.medium,
  color: c.ink[1],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const extNameReconciled = style({ color: c.ink[3] })
export const extDesc = style({
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[4],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const extRef = style({ display: 'flex', flexDirection: 'column', gap: '0.0625rem', minInlineSize: 0 })
export const extRefLine = style({
  fontFamily: recon.font.mono,
  fontSize: fs.xs,
  fontWeight: recon.weight.medium,
  color: c.ink[3],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const extRefId = style({
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  color: c.ink[5],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
const extValBase = {
  fontFamily: recon.font.mono,
  fontSize: fs.md,
  fontWeight: recon.weight.semibold,
  textAlign: 'end',
  justifySelf: 'end',
  fontVariantNumeric: 'tabular-nums',
} as const
export const extVal = styleVariants({
  in: { ...extValBase, color: c.green.deep },
  out: { ...extValBase, color: c.red.deep },
  empty: { ...extValBase, color: c.ink[6], fontWeight: recon.weight.regular },
})
export const extSaldo = style({
  fontFamily: recon.font.mono,
  fontSize: fs.md,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
  textAlign: 'end',
  justifySelf: 'end',
  fontVariantNumeric: 'tabular-nums',
})

// divisor de dia
export const extDayDivider = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.xl,
  paddingInline: sp['3xl'],
  paddingBlock: '0.5rem',
  background: c.paper.warm,
  borderBlock: `${bw.thin} solid ${c.paper.rule}`,
  selectors: { '&::after': { content: '""', flex: 1, blockSize: bw.hairline, background: c.paper.rule } },
})
export const extDayLabel = style({
  fontFamily: recon.font.mono,
  fontSize: fs.xs,
  fontWeight: recon.weight.semibold,
  color: c.ink[2],
})
export const extDayMeta = style({
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.medium,
  color: c.ink[5],
})
export const extDayIn = style({ color: c.green.deep })
export const extDayOut = style({ color: c.red.deep })
export const extDaySaldo = style({
  fontFamily: recon.font.mono,
  fontSize: fs.sm,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
  marginInlineStart: 'auto',
})
export const extDaySaldoLbl = style({
  color: c.ink[5],
  fontWeight: recon.weight.medium,
  marginInlineEnd: '0.3125rem',
})

// footer de totais
export const extFoot = style({
  ...extGridCols,
  flexShrink: 0,
  blockSize: '2.875rem',
  background: c.paper.beige,
  borderBlockStart: `${bw.thin} solid ${c.paper.rule}`,
})
export const extFtLbl = style({
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: c.ink[3],
})
export const extFtIn = style({
  fontFamily: recon.font.mono,
  fontSize: fs.md,
  fontWeight: recon.weight.bold,
  color: c.green.deep,
  textAlign: 'end',
  justifySelf: 'end',
})
export const extFtOut = style({
  fontFamily: recon.font.mono,
  fontSize: fs.md,
  fontWeight: recon.weight.bold,
  color: c.red.deep,
  textAlign: 'end',
  justifySelf: 'end',
})
export const extFtSaldo = style({
  fontFamily: recon.font.mono,
  fontSize: fs.lg,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
  textAlign: 'end',
  justifySelf: 'end',
})

// ── Modal "Alterar conta" — fiel ao mock (modal-acc): cabeçalho + busca + lista agrupada ──
export const modalOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: sp.lg,
  background: c.overlay,
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
})
export const modalDialog = style({
  display: 'flex',
  flexDirection: 'column',
  inlineSize: '35rem', // 560px
  maxBlockSize: '84vh',
  background: c.paper.default,
  borderRadius: r.xl,
  boxShadow: recon.shadow.menu,
  overflow: 'hidden',
})
export const modalHead = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: sp.lg,
  paddingBlock: '1rem',
  paddingInline: '1.25rem',
  borderBlockEnd: `${bw.hairline} solid ${c.paper.rule}`,
})
export const modalHeadIc = style({ color: c.teal.deep, display: 'inline-flex', flexShrink: 0 })
export const modalTitle = style({
  margin: 0,
  fontFamily: recon.font.sans,
  fontSize: fs.xl,
  fontWeight: recon.weight.semibold,
  color: c.ink[1],
  letterSpacing: '-0.005em',
})
export const modalSub = style({
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[5],
  marginInlineStart: sp.sm,
})
export const modalClose = style({
  marginInlineStart: 'auto',
  inlineSize: '1.625rem',
  blockSize: '1.625rem',
  borderRadius: r.sm,
  border: 'none',
  background: 'transparent',
  color: c.ink[4],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: fs.xl,
  cursor: 'pointer',
  transition: `background ${recon.tFast}`,
  selectors: { '&:hover': { background: c.paper.warm, color: c.ink[2] } },
})

export const modalSearch = style({
  flexShrink: 0,
  paddingBlock: sp.md,
  paddingInline: '1rem',
  background: c.paper.warm,
  borderBlockEnd: `${bw.hairline} solid ${c.paper.rule}`,
})
export const modalSearchBox = style({ position: 'relative', display: 'flex', alignItems: 'center' })
export const modalSearchIcon = style({
  position: 'absolute',
  insetInlineStart: '0.625rem',
  display: 'inline-flex',
  color: c.ink[5],
  pointerEvents: 'none',
})
export const modalSearchInput = style({
  inlineSize: '100%',
  border: `${bw.hairline} solid ${c.paper.rule}`,
  background: c.paper.default,
  paddingBlock: sp.sm,
  paddingInlineEnd: sp.md,
  paddingInlineStart: '2rem',
  borderRadius: r.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  color: c.ink[1],
  outline: 'none',
  transition: `box-shadow ${recon.tFast}, border-color ${recon.tFast}`,
  selectors: {
    '&:focus': { borderColor: c.teal.normal, boxShadow: `0 0 0 ${bw.ring} ${c.teal.bg}` },
    '&::placeholder': { color: c.ink[5] },
  },
})

export const modalBody = style({
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
  paddingBlock: '0.375rem 0.5rem',
  paddingInline: '0.375rem',
  ...scrollSoft,
})

export const accGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.md,
  paddingBlock: '0.625rem 0.375rem',
  paddingInline: '0.875rem',
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: c.ink[5],
  selectors: { '&::after': { content: '""', flex: 1, blockSize: bw.hairline, background: c.paper.rule } },
})

const accItemBase = {
  display: 'grid',
  gridTemplateColumns: '2.5rem 1fr auto auto',
  gap: sp.xl,
  alignItems: 'center',
  inlineSize: '100%',
  textAlign: 'start',
  paddingBlock: sp.lg,
  paddingInline: '0.875rem',
  marginInline: '0.25rem',
  borderRadius: r.md,
  border: `${bw.hairline} solid transparent`,
  background: 'transparent',
  transition: `background ${recon.tFast}, border-color ${recon.tFast}`,
} as const
export const accItem = styleVariants({
  active: {
    ...accItemBase,
    cursor: 'pointer',
    selectors: { '&:hover': { background: c.paper.warm, borderColor: c.paper.rule } },
  },
  current: {
    ...accItemBase,
    cursor: 'pointer',
    background: c.teal.bg,
    borderColor: c.teal.line,
    selectors: { '&:hover': { background: c.teal.bg2 } },
  },
  closed: { ...accItemBase, opacity: 0.55, cursor: 'default' },
})

export const accMark = style({
  inlineSize: '2.5rem',
  blockSize: '2.5rem',
  borderRadius: '0.5625rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  background: `linear-gradient(135deg, ${c.teal.normal}, ${c.teal.deep})`,
  color: c.paper.default,
  fontFamily: recon.font.sans,
  fontSize: fs.xl,
  fontWeight: recon.weight.semibold,
  letterSpacing: '-0.02em',
})
export const accItemInfo = style({ minInlineSize: 0, textAlign: 'start' })
export const accItemName = style({
  fontFamily: recon.font.sans,
  fontSize: fs.lg,
  fontWeight: recon.weight.semibold,
  color: c.ink[1],
  marginBlockEnd: '0.125rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const accItemMeta = style({ fontFamily: recon.font.mono, fontSize: fs.xs, color: c.ink[4] })
export const accItemBal = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.0625rem',
})
export const accBalVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs.lg,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
})
export const accBalUpd = style({ fontFamily: recon.font.mono, fontSize: '0.59375rem', color: c.ink[5] })
export const accState = styleVariants({
  none: {
    inlineSize: '1.5rem',
    blockSize: '1.5rem',
    borderRadius: r.pill,
    flexShrink: 0,
  },
  current: {
    inlineSize: '1.5rem',
    blockSize: '1.5rem',
    borderRadius: r.pill,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: c.teal.normal,
    color: c.paper.default,
  },
})

export const accAdd = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.md,
  paddingBlock: sp.lg,
  paddingInline: '0.875rem',
  marginBlock: '0.5rem 0.25rem',
  marginInline: '0.25rem',
  border: `${bw.hairline} dashed ${c.teal.line}`,
  borderRadius: r.md,
  background: c.teal.bg,
  color: c.teal.deep,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  fontWeight: recon.weight.medium,
  cursor: 'pointer',
  transition: `background ${recon.tFast}`,
  selectors: { '&:hover': { background: c.teal.bg2 } },
})

export const modalNotice = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: sp.sm,
  paddingBlock: '2rem',
  paddingInline: '1rem',
  textAlign: 'center',
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  color: c.ink[4],
})

// ── Modal "Detalhes da conciliação" (modal-match) — fiel ao mock ────────────────
export const matchDialog = style({
  display: 'flex',
  flexDirection: 'column',
  inlineSize: '45rem', // 720px
  maxInlineSize: '92vw',
  maxBlockSize: '84vh',
  background: c.paper.default,
  borderRadius: r.xl,
  boxShadow: recon.shadow.menu,
  overflow: 'hidden',
})
export const mmHead = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: sp.lg,
  paddingBlock: '1rem',
  paddingInline: '1.25rem',
  background: `linear-gradient(180deg, ${c.green.bg} 0%, ${c.paper.default} 100%)`,
  borderBlockEnd: `${bw.hairline} solid ${c.green.line}`,
})
export const matchHeadIc = style({
  inlineSize: '2.25rem',
  blockSize: '2.25rem',
  borderRadius: '0.5625rem',
  background: c.green.normal,
  color: c.paper.default,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: recon.shadow.card,
})
export const matchHeadText = style({ display: 'flex', flexDirection: 'column' })
export const matchTitle = style({
  margin: 0,
  fontFamily: recon.font.sans,
  fontSize: fs.xl,
  fontWeight: recon.weight.bold,
  color: c.green.deep,
  letterSpacing: '-0.005em',
})
export const matchSub = style({
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.green.deep,
  marginBlockStart: '0.0625rem',
})

export const matchBody = style({
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
  paddingBlock: '1.25rem',
  paddingInline: '1.375rem',
  ...scrollSoft,
})

export const matchPair = style({
  display: 'grid',
  gridTemplateColumns: '1fr 4.5rem 1fr',
  alignItems: 'stretch',
  marginBlockEnd: '1.375rem',
})
const mmSideBase = {
  display: 'flex',
  flexDirection: 'column',
  paddingBlock: '0.875rem',
  paddingInline: '1rem',
  borderRadius: r.lg,
  border: `${bw.hairline} solid ${c.paper.rule}`,
  background: c.paper.warm,
} as const
export const mmSide = styleVariants({
  ext: mmSideBase,
  doc: { ...mmSideBase, background: c.teal.bg, borderColor: c.teal.line },
})
export const mmSideLbl = styleVariants({
  ext: {
    fontFamily: recon.font.sans,
    fontSize: '0.59375rem',
    fontWeight: recon.weight.bold,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: c.ink[5],
    marginBlockEnd: sp.sm,
  },
  doc: {
    fontFamily: recon.font.sans,
    fontSize: '0.59375rem',
    fontWeight: recon.weight.bold,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: c.teal.deep,
    marginBlockEnd: sp.sm,
  },
})
export const mmSideTitle = style({
  fontFamily: recon.font.sans,
  fontSize: '0.875rem',
  fontWeight: recon.weight.semibold,
  color: c.ink[1],
  marginBlockEnd: sp.md,
  letterSpacing: '-0.005em',
  overflowWrap: 'break-word',
})
export const mmSideRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: sp.lg,
  paddingBlock: '0.25rem',
})
// Linha do TOTAL conciliado (conciliação 1 saída → N títulos): separador acima p/ destacar o somatório.
export const mmTotalRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: sp.lg,
  paddingBlockStart: sp.sm,
  marginBlockStart: sp.xs,
  borderBlockStart: `${recon.border.thin} solid ${c.paper.rule}`,
})
// Dica do lado multi-título (nome/nº de cada título dependem do enriquecimento do backend).
export const mmMultiHint = style({
  display: 'block',
  marginBlockStart: sp.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.xs,
  color: c.ink[5],
})
export const mmSideK = style({
  fontFamily: recon.font.sans,
  fontSize: '0.71875rem',
  color: c.ink[5],
  flexShrink: 0,
})
export const mmSideV = style({
  fontFamily: recon.font.mono,
  fontSize: fs.xs,
  fontWeight: recon.weight.medium,
  color: c.ink[2],
  textAlign: 'end',
  wordBreak: 'break-all',
})
export const mmSideVAmt = styleVariants({
  ext: {
    fontFamily: recon.font.mono,
    fontSize: fs.lg,
    fontWeight: recon.weight.bold,
    color: c.ink[1],
    textAlign: 'end',
  },
  doc: {
    fontFamily: recon.font.mono,
    fontSize: fs.lg,
    fontWeight: recon.weight.bold,
    color: c.teal.deep,
    textAlign: 'end',
  },
})

export const matchBridge = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      insetBlockStart: '50%',
      insetInline: 0,
      blockSize: bw.hairline,
      background: c.green.normal,
      opacity: 0.5,
      zIndex: 1,
    },
  },
})
export const matchBadge = style({
  position: 'relative',
  zIndex: 2,
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingBlock: '0.25rem',
  paddingInline: '0.5625rem',
  background: c.green.normal,
  color: c.paper.default,
  borderRadius: r.pill,
  fontFamily: recon.font.sans,
  fontSize: '0.59375rem',
  fontWeight: recon.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  boxShadow: recon.shadow.card,
})

export const matchSection = style({ marginBlockEnd: sp['2xl'] })
export const matchSectionLbl = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.md,
  marginBlockEnd: sp.md,
  fontFamily: recon.font.sans,
  fontSize: '0.59375rem',
  fontWeight: recon.weight.bold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: c.ink[5],
  selectors: { '&::after': { content: '""', flex: 1, blockSize: bw.hairline, background: c.paper.rule } },
})
export const matchAuditRows = style({
  display: 'grid',
  gridTemplateColumns: '6.875rem 1fr',
  rowGap: '0.5625rem',
  columnGap: '1rem',
  alignItems: 'center',
  paddingBlock: '0.875rem',
  paddingInline: '1rem',
  background: c.paper.warm,
  borderRadius: r.md,
  border: `${bw.hairline} solid ${c.paper.rule}`,
})
export const auditLbl = style({
  fontFamily: recon.font.sans,
  fontSize: '0.59375rem',
  fontWeight: recon.weight.bold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: c.ink[5],
})
export const auditV = style({
  fontFamily: recon.font.mono,
  fontSize: '0.71875rem',
  fontWeight: recon.weight.medium,
  color: c.ink[2],
})

export const matchFoot = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  paddingBlock: '0.875rem',
  paddingInline: '1.25rem',
  background: c.paper.warm,
  borderBlockStart: `${bw.hairline} solid ${c.paper.rule}`,
})
export const matchFootSpacer = style({ flex: 1 })
const footBtnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.sm,
  paddingBlock: sp.sm,
  paddingInline: sp.lg,
  borderRadius: r.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  fontWeight: recon.weight.medium,
  cursor: 'pointer',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  transition: `background ${recon.tFast}, border-color ${recon.tFast}`,
} as const
export const footBtnUndo = style({
  ...footBtnBase,
  background: c.paper.default,
  color: c.orange.deep,
  border: `${bw.hairline} solid ${c.orange.line}`,
  selectors: {
    '&:hover:not(:disabled)': { background: c.orange.bg },
    '&:disabled': { color: c.ink[6], borderColor: c.paper.rule, cursor: 'not-allowed' },
  },
})
export const footBtnSecondary = style({
  ...footBtnBase,
  background: c.paper.default,
  color: c.ink[2],
  border: `${bw.hairline} solid ${c.paper.rule}`,
  selectors: {
    '&:hover:not(:disabled)': { background: c.paper.warm, borderColor: c.ink[6] },
    '&:disabled': { color: c.ink[6], cursor: 'not-allowed' },
  },
})
export const footBtnPrimary = style({
  ...footBtnBase,
  background: c.teal.normal,
  color: c.paper.default,
  border: `${bw.hairline} solid transparent`,
  fontWeight: recon.weight.semibold,
  selectors: { '&:hover': { background: c.teal.deep } },
})
