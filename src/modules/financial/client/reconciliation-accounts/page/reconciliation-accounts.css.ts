/**
 * Grid de contas-cedente (TELA 1) — estilos (vanilla-extract). **Fidelidade ao mock** `grid_conciliacao`
 * via a camada de tokens do módulo (`recon.values.ts`). Estrutura: topbar (consolidado) · filter-bar
 * (busca + chips de status + ordenar) · grid (head + rows: bank-mark, conta, atualização, saldo, pill,
 * seta) · footer · barra "Adicionar conta" · modal. §X: zero literal cru (tudo via `recon.*`).
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
  background: c.paper.default,
  color: c.ink[2],
})

// ── topbar ──────────────────────────────────────────────────────────────────────
export const topbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.lg,
  paddingInline: sp['3xl'],
  paddingBlock: sp.lg,
  background: c.paper.default,
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
})
export const topTitle = style({
  fontFamily: recon.font.sans,
  fontSize: fs.xl,
  fontWeight: recon.weight.medium,
  color: c.ink[1],
})
export const countChip = style({
  fontFamily: recon.font.mono,
  fontSize: fs['2xs'],
  color: c.ink[4],
  background: c.paper.warm,
  borderRadius: r.pill,
  paddingInline: sp.sm,
  paddingBlock: '0.125rem',
})
export const summary = style({
  marginInlineStart: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: sp.xs,
  fontFamily: recon.font.mono,
  fontSize: fs.lg,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
})

// ── filter-bar ────────────────────────────────────────────────────────────────
export const filterBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.lg,
  paddingInline: sp['3xl'],
  paddingBlock: sp.lg,
  background: c.paper.default,
})
export const search = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  inlineSize: '20rem',
  maxInlineSize: '40%',
  paddingInline: sp.lg,
  paddingBlock: sp.sm,
  borderRadius: r.md,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.warm,
  color: c.ink[4],
})
export const searchInput = style({
  flex: 1,
  border: 'none',
  background: 'transparent',
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  color: c.ink[1],
  outline: 'none',
})
// Segmented control (padrão do grid de Contas a Pagar): trilho paper-warm; chip ativo = paper + sombra.
export const statusChips = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.125rem',
  padding: '0.125rem',
  background: c.paper.warm,
  borderRadius: r.md,
  overflowX: 'auto',
})
const chipBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  blockSize: '1.875rem',
  paddingInline: sp.md,
  border: 'none',
  borderRadius: r.sm,
  background: 'transparent',
  color: c.ink[4],
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  fontWeight: recon.weight.semibold,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: `background ${recon.tFast}, color ${recon.tFast}, box-shadow ${recon.tFast}`,
} as const
export const chip = styleVariants({
  inactive: {
    ...chipBase,
    selectors: { '&:hover': { background: c.paper.default, color: c.ink[2], boxShadow: recon.shadow.card } },
  },
  active: { ...chipBase, background: c.paper.default, color: c.ink[1], boxShadow: recon.shadow.card },
})
const chipCountBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.medium,
  minInlineSize: '1rem',
  blockSize: '1rem',
  paddingInline: '0.25rem',
  borderRadius: r.sm,
} as const
export const chipCount = styleVariants({
  inactive: { ...chipCountBase, color: c.ink[5], background: c.paper.warm },
  active: { ...chipCountBase, color: c.ink[2], background: c.paper.beige },
})
export const chipDot = styleVariants({
  pending: {
    inlineSize: '0.4375rem',
    blockSize: '0.4375rem',
    borderRadius: r.pill,
    background: c.orange.normal,
  },
  upToDate: {
    inlineSize: '0.4375rem',
    blockSize: '0.4375rem',
    borderRadius: r.pill,
    background: c.green.normal,
  },
  closed: { inlineSize: '0.4375rem', blockSize: '0.4375rem', borderRadius: r.pill, background: c.ink[5] },
})
export const sortWrap = style({ marginInlineStart: 'auto' })
export const sortBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  borderRadius: r.md,
  paddingInline: sp.lg,
  paddingBlock: sp.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[2],
  cursor: 'pointer',
})

// ── grid ──────────────────────────────────────────────────────────────────────
// Padrão do grid de Contas a Pagar: card com borda + raio, header sticky, linhas com hairline (última
// sem borda), scroller interno discreto.
export const gridWrap = style({ flex: 1, minBlockSize: 0, paddingInline: sp['3xl'], paddingBlock: sp.lg })
export const grid = style({
  overflow: 'auto',
  border: `${bw.thin} solid ${c.paper.rule}`,
  borderRadius: r.lg,
  background: c.paper.default,
})
const gridCols = {
  display: 'grid',
  gridTemplateColumns: '1fr 12rem 12rem 11rem 3rem',
  gap: sp.xl,
  alignItems: 'center',
} as const
export const gridHead = style({
  ...gridCols,
  position: 'sticky',
  insetBlockStart: 0,
  zIndex: 5,
  minBlockSize: '2.25rem',
  paddingInline: sp.xl,
  background: c.paper.warm,
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: c.ink[5],
})
export const gridHeadRight = style({ textAlign: 'end' })
export const gridBody = style({ display: 'flex', flexDirection: 'column' })

const gridRowBase = {
  ...gridCols,
  inlineSize: '100%',
  textAlign: 'start',
  border: 'none',
  minBlockSize: '3.5rem',
  paddingInline: sp.xl,
  paddingBlock: sp.lg,
  background: 'transparent',
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
  cursor: 'pointer',
  transition: `background ${recon.tFast}`,
} as const
export const gridRow = styleVariants({
  base: {
    ...gridRowBase,
    selectors: { '&:hover': { background: c.paper.warm }, '&:last-child': { borderBlockEnd: 'none' } },
  },
  closed: {
    ...gridRowBase,
    opacity: 0.55,
    cursor: 'not-allowed',
    selectors: { '&:last-child': { borderBlockEnd: 'none' } },
  },
})

export const colConta = style({ display: 'flex', alignItems: 'center', gap: sp.lg, minInlineSize: 0 })
export const bankMark = style({
  inlineSize: '2.625rem',
  blockSize: '2.625rem',
  borderRadius: r.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  background: `linear-gradient(135deg, ${c.teal.normal}, ${c.teal.deep})`,
  color: c.paper.default,
  fontFamily: recon.font.sans,
  fontSize: fs.lg,
  fontWeight: recon.weight.semibold,
})
export const contaInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.0625rem',
  minInlineSize: 0,
})
export const contaNome = style({
  fontFamily: recon.font.sans,
  fontSize: fs.lg,
  fontWeight: recon.weight.semibold,
  color: c.ink[1],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const contaMeta = style({ fontFamily: recon.font.mono, fontSize: fs['3xs'], color: c.ink[4] })
export const updRel = style({ fontFamily: recon.font.sans, fontSize: fs.sm, color: c.ink[3] })
export const updAbs = style({ fontFamily: recon.font.mono, fontSize: fs['3xs'], color: c.ink[5] })
export const saldoCol = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.0625rem',
})
export const saldoVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs.lg, // reduzido (13px) p/ alinhar ao valor de linha do grid de Contas a Pagar
  fontWeight: recon.weight.semibold,
  color: c.ink[1],
})
export const saldoLbl = style({ fontFamily: recon.font.sans, fontSize: fs['3xs'], color: c.ink[5] })

const pillBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingInline: sp.lg,
  paddingBlock: sp.xs,
  borderRadius: r.pill,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  fontWeight: recon.weight.medium,
} as const
export const statusPill = styleVariants({
  pending: { ...pillBase, background: c.orange.bg, color: c.orange.deep },
  upToDate: { ...pillBase, background: c.green.bg, color: c.green.deep },
  closed: { ...pillBase, background: c.paper.beige, color: c.ink[4] },
})
export const pillDot = styleVariants({
  pending: {
    inlineSize: '0.375rem',
    blockSize: '0.375rem',
    borderRadius: r.pill,
    background: c.orange.normal,
  },
  upToDate: {
    inlineSize: '0.375rem',
    blockSize: '0.375rem',
    borderRadius: r.pill,
    background: c.green.normal,
  },
})
export const colArrow = style({ display: 'flex', justifyContent: 'flex-end', color: c.ink[5] })

// Seta = botão que alterna o EXPAND do cadastro (substitui o colArrow decorativo). Fica na 5ª coluna.
export const colArrowBtn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  color: c.ink[5],
  blockSize: '100%',
  selectors: { '&:hover': { color: c.ink[2] } },
})
const chevronBase = { display: 'inline-flex', transition: `transform ${recon.tFast}` } as const
export const chevron = style(chevronBase)
export const chevronOpen = style({ ...chevronBase, transform: 'rotate(180deg)' })

// Painel expandido (dados do cadastro: saldo inicial + data), logo abaixo da linha. Indentado p/ alinhar
// sob o nome da conta (depois do bank-mark). Fundo discreto + linha embaixo, no padrão do grid.
export const expandPanel = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: sp['3xl'],
  paddingBlock: sp.lg,
  paddingInlineEnd: sp.xl,
  paddingInlineStart: `calc(2.625rem + ${sp.lg} + ${sp.xl})`,
  background: c.paper.warm,
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
})
export const expandItem = style({ display: 'flex', flexDirection: 'column', gap: '0.125rem' })
export const expandLbl = style({ fontFamily: recon.font.sans, fontSize: fs['3xs'], color: c.ink[5] })
export const expandVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs.sm,
  fontWeight: recon.weight.semibold,
  color: c.ink[2],
})

// ── footer da grade ──────────────────────────────────────────────────────────
export const gridFoot = style({
  ...gridCols,
  paddingInline: sp['3xl'],
  paddingBlock: sp.lg,
  background: c.paper.beige,
  borderBlockStart: `${bw.thin} solid ${c.paper.rule}`,
  fontFamily: recon.font.mono,
})
export const ftLabel = style({ fontFamily: recon.font.sans, fontSize: fs.sm, color: c.ink[4] })
export const ftVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs.lg,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
  textAlign: 'end',
})
export const ftPending = style({
  fontFamily: recon.font.mono,
  fontSize: fs.lg,
  fontWeight: recon.weight.bold,
  color: c.orange.deep,
  textAlign: 'end',
})

// ── estados (loading/unavailable/empty/error) ──────────────────────────────────
export const stateBox = style({
  margin: 'auto',
  maxInlineSize: '34rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: sp.lg,
  paddingBlock: '3rem',
  paddingInline: sp['3xl'],
  textAlign: 'center',
})
export const stateTitle = style({
  fontFamily: recon.font.sans,
  fontSize: fs.xl,
  fontWeight: recon.weight.semibold,
  color: c.ink[1],
})
export const stateBody = style({
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  color: c.ink[3],
  lineHeight: 1.5,
})
export const noticeChrome = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingInline: sp.lg,
  paddingBlock: sp.xs,
  borderRadius: r.pill,
  background: c.amber.bg,
  color: c.amber.deep,
  fontFamily: recon.font.mono,
  fontSize: fs['3xs'],
})

// ── bottombar (Adicionar conta) ────────────────────────────────────────────────
// Footer no padrão do grid de Contas a Pagar: fixo, paper-warm, borda superior, recuado pela sidebar.
export const bottombar = style({
  position: 'fixed',
  insetBlockEnd: 0,
  insetInlineStart: 'var(--sidebar-width, 14rem)',
  insetInlineEnd: 0,
  blockSize: '3.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: sp.lg,
  paddingInline: sp.xl,
  background: c.paper.warm,
  borderBlockStart: `${bw.thin} solid ${c.paper.rule}`,
  fontFamily: recon.font.sans,
  zIndex: 100,
})
export const footConsolidated = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: sp.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.ink[4],
})
export const footConsolidatedVal = style({
  fontFamily: recon.font.mono,
  fontSize: fs.lg,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
})
export const footPending = style({ fontFamily: recon.font.sans, fontSize: fs.sm, color: c.orange.deep })
export const bottomActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  marginInlineStart: 'auto',
})

const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: sp.xs,
  paddingInline: sp.lg,
  paddingBlock: sp.sm,
  borderRadius: r.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  fontWeight: recon.weight.semibold,
  cursor: 'pointer',
  textDecoration: 'none',
} as const
export const btnPrimary = style({
  ...btnBase,
  border: 'none',
  background: c.teal.normal,
  color: c.paper.default,
  selectors: {
    '&:hover:not(:disabled)': { background: c.teal.deep },
    '&:disabled': { background: c.ink[6], cursor: 'not-allowed' },
  },
})
export const btnSecondary = style({
  ...btnBase,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  color: c.ink[2],
  fontWeight: recon.weight.medium,
  selectors: { '&:disabled': { opacity: 0.5, cursor: 'not-allowed' } },
})

// ── modal "Adicionar conta bancária" ───────────────────────────────────────────
export const overlay = style({
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: sp['3xl'],
  background: c.overlay,
  backdropFilter: 'blur(3px)',
  zIndex: 100,
})
export const modal = style({
  inlineSize: '35rem',
  maxInlineSize: '92vw',
  maxBlockSize: '84vh',
  overflowY: 'auto',
  background: c.paper.default,
  borderRadius: r.xl,
  boxShadow: recon.shadow.menu,
  display: 'flex',
  flexDirection: 'column',
})
export const modalHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.lg,
  padding: sp['2xl'],
  borderBlockEnd: `${bw.thin} solid ${c.paper.rule}`,
})
export const modalTitle = style({
  fontFamily: recon.font.sans, // sans (Inter) p/ consistência com o restante do modal — sem o serif do header
  fontSize: fs.lg,
  fontWeight: recon.weight.bold,
  color: c.ink[1],
})
export const modalSub = style({ fontFamily: recon.font.sans, fontSize: fs.sm, color: c.ink[4] })
export const modalClose = style({
  marginInlineStart: 'auto',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: c.ink[4],
  fontSize: fs.xl,
})
export const modalBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sp['2xl'],
  padding: sp['2xl'],
})
export const formSection = style({ display: 'flex', flexDirection: 'column', gap: sp.lg })
export const sectionTitle = style({
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  fontWeight: recon.weight.semibold,
  color: c.ink[2],
})
export const formRow = style({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.lg })
export const formField = style({ display: 'flex', flexDirection: 'column', gap: '0.25rem' })
export const fieldLabel = style({ fontFamily: recon.font.sans, fontSize: fs.sm, color: c.ink[3] })
export const input = style({
  inlineSize: '100%',
  boxSizing: 'border-box',
  blockSize: '2.375rem', // altura padrão dos campos (igual ao seletor de banco)
  paddingInline: sp.lg,
  paddingBlock: sp.sm,
  borderRadius: r.md,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  color: c.ink[1],
})
export const segmented = style({ display: 'flex', gap: sp.xs })
const segBase = {
  flex: 1,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  borderRadius: r.md,
  paddingBlock: sp.sm,
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  cursor: 'pointer',
} as const
export const segBtn = styleVariants({
  off: { ...segBase, color: c.ink[3] },
  on: {
    ...segBase,
    color: c.teal.deep,
    background: c.teal.bg,
    borderColor: c.teal.normal,
    fontWeight: recon.weight.semibold,
  },
  // Chrome honesto: tipo ainda não aceito pelo backend (cartão/outro, core-api#206).
  disabled: { ...segBase, color: c.ink[3], opacity: 0.45, cursor: 'not-allowed' },
})
export const segHint = style({
  marginBlockStart: sp.xs,
  fontSize: fs.xs,
  color: c.ink[3],
})
export const modalFoot = style({
  display: 'flex',
  alignItems: 'center',
  gap: sp.sm,
  padding: sp['2xl'],
  background: c.paper.warm,
  borderBlockStart: `${bw.thin} solid ${c.paper.rule}`,
})
export const spacer = style({ flex: 1 })

// ── refinamentos do modal "Nova Conta Bancária" (fiel ao mock) ───────────────────
export const mhIc = style({
  inlineSize: '2.25rem',
  blockSize: '2.25rem',
  borderRadius: r.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  background: c.teal.bg,
  color: c.teal.deep,
})
export const mhText = style({ display: 'flex', flexDirection: 'column', gap: '0.0625rem', minInlineSize: 0 })
export const sectionTitleRow = style({ display: 'flex', alignItems: 'center', gap: sp.sm })
export const optionalTag = style({
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  fontWeight: recon.weight.medium,
  color: c.teal.deep,
  background: c.teal.bg,
  borderRadius: r.sm,
  paddingInline: sp.xs,
  paddingBlock: '0.0625rem',
  textTransform: 'none',
})
export const aliasHint = style({ fontFamily: recon.font.sans, fontSize: fs['3xs'], color: c.ink[5] })
export const selectField = style({
  inlineSize: '100%',
  boxSizing: 'border-box',
  blockSize: '2.375rem', // mesma altura dos inputs (proporcional aos demais campos)
  paddingInline: sp.lg,
  paddingBlock: sp.sm,
  borderRadius: r.md,
  border: `${bw.thin} solid ${c.paper.rule}`,
  background: c.paper.default,
  fontFamily: recon.font.sans,
  fontSize: fs.md,
  color: c.ink[4],
  cursor: 'pointer',
})
export const inputMono = style({ fontFamily: recon.font.mono })
export const infoNotice = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: sp.sm,
  padding: sp.lg,
  borderRadius: r.md,
  background: c.teal.bg,
  border: `${bw.thin} solid ${c.teal.line}`,
  color: c.teal.deep,
})
export const infoNoticeIcon = style({ flexShrink: 0, marginBlockStart: '0.0625rem' })
export const infoNoticeText = style({
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  lineHeight: 1.5,
  color: c.ink[3],
})
export const pendingHint = style({
  fontFamily: recon.font.sans,
  fontSize: fs['3xs'],
  color: c.ink[5],
  marginInlineEnd: 'auto',
})
export const errorText = style({
  fontFamily: recon.font.sans,
  fontSize: fs.sm,
  color: c.red.deep,
  paddingInline: sp['2xl'],
  paddingBlockEnd: sp.sm,
})
