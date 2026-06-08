import { style, globalStyle } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens/index.ts'

/* ── Layout raiz ── */
export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
})

export const topbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  flexShrink: 0,
})

export const backButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink4,
  cursor: 'pointer',
  fontSize: vars.font.size.sm,
  transition: 'color 120ms, background 120ms',
  ':hover': {
    color: vars.color.institutional.ink2,
    background: vars.color.institutional.blueBg,
  },
})

export const topbarTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: '1.125rem',
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
  letterSpacing: '-0.01em',
  lineHeight: 1.3,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexWrap: 'wrap',
})

export const topbarMeta = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.75rem',
  color: vars.color.institutional.ink2,
  background: vars.color.institutional.blueBg,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.blueLine}`,
})

export const statusBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.md,
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.semibold,
})

export const statusBadgePending = style({
  background: vars.color.status.pendingBg,
  color: vars.color.status.pendingText,
})

export const statusBadgeActive = style({
  background: vars.color.status.activeBg,
  color: vars.color.status.activeText,
})

export const statusBadgeFinished = style({
  background: vars.color.status.finishedBg,
  color: vars.color.status.finishedText,
})

export const statusBadgeTerminated = style({
  background: vars.color.status.terminatedBg,
  color: vars.color.status.terminatedText,
})

/* ── Layout principal 2 colunas ── */
export const mainLayout = style({
  display: 'flex',
  flex: 1,
  gap: vars.space.xl,
  minHeight: 0,
  overflow: 'hidden',
})

export const mainCol = style({
  flex: 1,
  minWidth: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingTop: vars.space.lg,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.xs,
  paddingBottom: '4rem',
  display: 'flex',
  flexDirection: 'column',
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.institutional.paperRule} transparent`,
})

globalStyle(`${mainCol}::-webkit-scrollbar`, {
  width: '0.25rem',
})

globalStyle(`${mainCol}::-webkit-scrollbar-track`, {
  background: 'transparent',
})

globalStyle(`${mainCol}::-webkit-scrollbar-thumb`, {
  background: vars.color.institutional.paperRule,
  borderRadius: vars.radius.lg,
})

globalStyle(`${mainCol}::-webkit-scrollbar-thumb:hover`, {
  background: vars.color.institutional.ink5,
})

export const asideCol = style({
  width: '22.5rem',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  padding: vars.space.lg,
  paddingBottom: '4rem',
  overflowY: 'auto',
  overflowX: 'hidden',
  background: vars.color.surface.default,
  borderLeft: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.institutional.paperRule} transparent`,
})

globalStyle(`${asideCol}::-webkit-scrollbar`, {
  width: '0.25rem',
})

globalStyle(`${asideCol}::-webkit-scrollbar-track`, {
  background: 'transparent',
})

globalStyle(`${asideCol}::-webkit-scrollbar-thumb`, {
  background: vars.color.institutional.paperRule,
  borderRadius: vars.radius.lg,
})

/* ═══ Redesign (wireframe) — Contratado · Dados Vigentes · Dados do Contrato ═══
   Layout/estrutura da wireframe mapeados aos tokens do nosso DS (teal → azul institucional). */

export const contractedHero = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  paddingBottom: vars.space.md,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const overline = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6rem',
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.1em',
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexWrap: 'wrap',
})

export const overlinePill = style({
  fontFamily: vars.font.family.body,
  fontSize: '0.5625rem',
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.06em',
  color: vars.color.institutional.ink4,
  background: vars.color.institutional.paperBeige,
  padding: `0.125rem ${vars.space.xs}`,
  borderRadius: vars.radius.sm,
  textTransform: 'uppercase',
})

export const contractedName = style({
  fontFamily: vars.font.family.heading,
  fontWeight: vars.font.weight.semibold,
  fontSize: '1.375rem',
  color: vars.color.institutional.ink2,
  letterSpacing: '-0.012em',
  lineHeight: 1.15,
  margin: 0,
})

export const contractedFantasia = style({
  color: vars.color.institutional.ink4,
  fontWeight: vars.font.weight.medium,
  fontSize: '1.125rem',
  marginLeft: vars.space.xs,
})

export const contractedMeta = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink4,
  marginTop: vars.space.xs,
})

export const sectionBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  paddingTop: vars.space.md,
  paddingBottom: vars.space.md,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const sectionHeadRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const sectionH3 = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: '0.8125rem',
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const sectionHeadAction = style({
  marginLeft: 'auto',
  fontFamily: vars.font.family.heading,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.blue,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  cursor: 'pointer',
  transition: 'background 120ms, border-color 120ms',
  ':hover': {
    borderColor: vars.color.institutional.blueLine,
    background: vars.color.institutional.blueBg,
  },
})

export const fieldRow = style({ display: 'grid', gap: vars.space.md })
export const frCols4 = style({ gridTemplateColumns: 'repeat(4, 1fr)' })
export const frCols3 = style({ gridTemplateColumns: 'repeat(3, 1fr)' })
export const frCols2 = style({ gridTemplateColumns: '1fr 1fr' })
export const frWide = style({ gridTemplateColumns: '1fr' })
export const frVigentes = style({ gridTemplateColumns: '1fr 1.5fr 1fr' })
export const frContratoBase = style({ gridTemplateColumns: '1.3fr 1fr 1fr 1fr' })
export const frBank = style({ gridTemplateColumns: '1.4fr 0.7fr 1fr 0.4fr' })

export const fld = style({ display: 'flex', flexDirection: 'column', gap: '0.3125rem', minWidth: 0 })

export const fldLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.6rem',
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
})

export const fldBox = style({
  display: 'flex',
  alignItems: 'center',
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  padding: `${vars.space.sm} 0.6875rem`,
  fontFamily: vars.font.family.body,
  fontSize: '0.78rem',
  color: vars.color.institutional.ink2,
  minHeight: '2.125rem',
  minWidth: 0,
})

export const fldValue = style({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const fldMono = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.75rem',
  letterSpacing: '0.01em',
})

export const fldBoxCalc = style({
  background: vars.color.institutional.blueBg,
  borderColor: vars.color.institutional.blueLine,
  '::before': {
    content: '"\\03A3"',
    fontSize: '0.625rem',
    fontWeight: vars.font.weight.semibold,
    color: vars.color.institutional.blueDeep,
    marginRight: vars.space.sm,
    opacity: 0.7,
  },
})

export const fldBoxSelect = style({
  '::after': {
    content: '"\\25BE"',
    color: vars.color.institutional.blue,
    fontSize: '0.625rem',
    marginLeft: vars.space.sm,
  },
})

/* Documentos — tabela de aditivos (grade hairline, wireframe) */
export const aditivos = style({
  display: 'flex',
  flexDirection: 'column',
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  background: vars.color.surface.default,
})

const aditGridCols = '6.5rem 4.5rem 5.5rem 1fr 7rem 8rem 3.5rem'

export const aditRow = style({
  display: 'grid',
  gridTemplateColumns: aditGridCols,
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `0.625rem ${vars.space.md}`,
  fontSize: '0.72rem',
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  transition: 'background 120ms',
  selectors: {
    '&:last-child': { borderBottom: 'none' },
  },
})

export const aditRowClickable = style({
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.paperWarm },
})

export const aditHead = style({
  background: vars.color.institutional.paperWarm,
  padding: `0.4375rem ${vars.space.md}`,
})

export const aditHeadCell = style({
  fontSize: '0.5625rem',
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink5,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
})

export const aditHeadCellRight = style({ textAlign: 'right' })

export const aditRowBase = style({
  background: vars.color.institutional.paperWarm,
})

export const aditNum = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.65rem',
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink2,
})

export const aditData = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink3,
})

export const aditResumo = style({
  color: vars.color.institutional.ink2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const aditImpacto = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  textAlign: 'right',
})
export const aditImpactoPos = style({ color: vars.color.institutional.greenDeep, fontWeight: vars.font.weight.semibold })
export const aditImpactoBase = style({ color: vars.color.institutional.ink2, fontWeight: vars.font.weight.semibold })
export const aditImpactoNeutral = style({ color: vars.color.institutional.ink4 })

export const docActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  justifyContent: 'flex-end',
})

export const docAct = style({
  width: '1.5rem',
  height: '1.5rem',
  borderRadius: vars.radius.sm,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.institutional.ink4,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.75rem',
  transition: 'background 120ms, color 120ms',
  ':hover': { background: vars.color.institutional.blueBg, color: vars.color.institutional.blueDeep },
})

/* Timeline (sidebar) — linha vertical + marcadores (wireframe) */
export const tlWrap = style({ display: 'flex', flexDirection: 'column' })

export const tlItem = style({
  position: 'relative',
  padding: `${vars.space.sm} 0 ${vars.space.sm} 1.125rem`,
  fontSize: '0.6875rem',
  borderLeft: `${vars.borderWidth.thick} solid ${vars.color.institutional.paperRule}`,
  marginLeft: '0.3125rem',
  '::before': {
    content: '""',
    position: 'absolute',
    left: '-0.3125rem',
    top: '0.6875rem',
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    background: vars.color.surface.default,
    border: `${vars.borderWidth.thick} solid ${vars.color.institutional.ink5}`,
  },
})

export const tlItemOk = style({
  '::before': { borderColor: vars.color.institutional.green, background: vars.color.institutional.green },
})

export const tlItemCurrent = style({
  '::before': { borderColor: vars.color.institutional.orange, background: vars.color.institutional.orange },
})

export const tlDate = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink5,
  marginBottom: '0.125rem',
  letterSpacing: '0.02em',
})

export const tlText = style({ color: vars.color.institutional.ink2, lineHeight: 1.45 })

/* Bottombar — barra inferior de status + ações (wireframe) */
export const bottombar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  height: '3.5rem',
  paddingInline: vars.space.lg,
  background: vars.color.surface.default,
  borderTop: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  flexShrink: 0,
  // Mesmo posicionamento do footer da tela de incluir contrato (full-width do conteúdo, fixo no rodapé).
  position: 'fixed',
  bottom: 0,
  left: 'var(--sidebar-width, 16.25rem)',
  right: 0,
  zIndex: 100,
})

export const bottombarStatus = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink4,
})

export const bottombarDot = style({
  width: '0.375rem',
  height: '0.375rem',
  borderRadius: '50%',
  background: vars.color.institutional.green,
})

export const bottombarStage = style({
  background: vars.color.status.activeBg,
  color: vars.color.status.activeText,
  padding: `0.1875rem ${vars.space.sm}`,
  borderRadius: vars.radius.lg,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.semibold,
})

export const bottombarActions = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

/* ── Hero card (legado — bloco simples sem chrome; será removido ao fim do redesign) ── */
export const heroCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

export const heroHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
})

export const heroTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
  lineHeight: 1.2,
})

export const heroSubtitle = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink4,
})

export const heroGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: vars.space.lg,
})

export const heroField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const heroLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink5,
})

export const heroValue = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink2,
})

/* ── Seções ── */
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

export const sectionTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.institutional.blue,
})

export const sectionGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: vars.space.lg,
})

export const sectionGrid2 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: vars.space.lg,
})

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const fieldLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink4,
})

export const fieldValue = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
})

/* ── Tabela de documentos ── */
export const tableWrap = style({
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
})

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: vars.font.size.sm,
})

export const tableHeader = style({
  background: vars.color.institutional.blueBg,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.blueLine}`,
})

export const tableHeaderCell = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink4,
  padding: `${vars.space.sm} ${vars.space.md}`,
  textAlign: 'left',
})

export const tableRow = style({
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  transition: 'background 80ms',
  ':hover': {
    background: vars.color.institutional.blueBg,
  },
})

export const tableCell = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  color: vars.color.institutional.ink2,
})

export const tableCellRight = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  color: vars.color.institutional.ink2,
  textAlign: 'right',
})

export const tableAction = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const tableActionBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.75rem',
  height: '1.75rem',
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink4,
  cursor: 'pointer',
  fontSize: vars.font.size.sm,
  transition: 'color 120ms, background 120ms',
  ':hover': {
    color: vars.color.institutional.blue,
    background: vars.color.institutional.blueBg,
  },
})

/* ── Badge de tipo de documento ── */
export const docBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.md,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.semibold,
})

export const docBadgeBase = style({
  background: vars.color.status.finishedBg,
  color: vars.color.status.finishedText,
})

export const docBadgePrazo = style({
  background: vars.color.status.prazoBg,
  color: vars.color.status.prazoText,
})

export const docBadgeValor = style({
  background: vars.color.status.valorBg,
  color: vars.color.status.valorText,
})

export const docBadgeEscopo = style({
  background: vars.color.status.escopoBg,
  color: vars.color.status.escopoText,
})

export const docBadgeDistrato = style({
  background: vars.color.status.distratoBg,
  color: vars.color.status.distratoText,
})

export const docBadgeOutro = style({
  background: vars.color.status.outroBg,
  color: vars.color.status.outroText,
})

/* ── Aside ── */
export const asideSection = style({
  display: 'flex',
  flexDirection: 'column',
})

/* Bloco "Valor Atual" (sb-hero) — único com régua embaixo, como na wireframe */
export const asideHero = style({
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: vars.space.lg,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const asideSectionLast = style({
  padding: vars.space.lg,
  flex: 1,
})

export const asideLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: vars.color.institutional.ink5,
  marginBottom: vars.space.sm,
})

// Overline do "Valor Atual" (sb-hero) — mono, como na wireframe (distinto dos h4 de seção em Inter).
export const asideOverline = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6rem',
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.1em',
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
  marginBottom: vars.space.sm,
})

export const asideValueWrap = style({
  fontFamily: vars.font.family.mono,
  color: vars.color.institutional.ink2,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.xs,
})

export const asideValueCurrency = style({
  fontSize: '0.8125rem',
  fontWeight: vars.font.weight.regular,
  color: vars.color.institutional.ink4,
})

export const asideValueInteger = style({
  fontSize: '1.625rem',
  fontWeight: vars.font.weight.medium,
})

export const asideValueCents = style({
  fontSize: '0.9375rem',
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink3,
})

export const compositionList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

export const compositionItem = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: vars.font.size.sm,
})

export const compositionItemPositive = style({
  color: vars.color.institutional.green,
})

export const compositionItemNegative = style({
  color: vars.color.status.terminatedText,
})

export const compositionItemPending = style({
  color: vars.color.institutional.ink5,
})

export const compositionTotal = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  paddingTop: vars.space.sm,
  borderTop: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  marginTop: vars.space.sm,
})

/* ── Barra de vigência ── */
export const vigenciaBar = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

export const vigenciaBarTrack = style({
  position: 'relative',
  height: '0.5rem',
  background: vars.color.institutional.paperRule,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
})

export const vigenciaBarFill = style({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  background: vars.color.institutional.blue,
  borderRadius: vars.radius.lg,
})

export const vigenciaBarLabels = style({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink5,
})

export const vigenciaAlert = style({
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.medium,
  color: vars.color.status.pendingText,
  background: vars.color.status.pendingBg,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.md,
})

/* ── Timeline ── */
export const timeline = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

export const timelineItem = style({
  display: 'flex',
  gap: vars.space.sm,
})

export const timelineDot = style({
  width: '0.625rem',
  height: '0.625rem',
  borderRadius: '50%',
  background: vars.color.institutional.blue,
  flexShrink: 0,
  marginTop: '0.25rem',
})

export const timelineDotGreen = style({
  background: vars.color.institutional.green,
})

export const timelineDotOrange = style({
  background: vars.color.status.escopoText,
})

export const timelineDotGray = style({
  background: vars.color.institutional.ink5,
})

export const timelineContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const timelineTitle = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink2,
})

export const timelineDate = style({
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink5,
})

/* ── Botões ── */
export const buttonPrimary = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  height: '2.5rem',
  padding: `0 ${vars.space.lg}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.surface.default,
  background: vars.color.institutional.blue,
  border: 'none',
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  transition: 'background 150ms, box-shadow 150ms',
  ':hover': {
    background: vars.color.institutional.blueDeep,
  },
})

export const buttonSecondary = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  height: '2.5rem',
  padding: `0 ${vars.space.lg}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink4,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  transition: 'background 150ms, border-color 150ms',
  ':hover': {
    background: vars.color.institutional.blueBg,
    borderColor: vars.color.institutional.blueLine,
  },
})
