import { style, styleVariants, globalStyle } from '@vanilla-extract/css'
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
  gap: vars.space.xs,
  // Mesma espessura do footer (bottombar) como padrão: altura fixa 3.5rem.
  height: '3.5rem',
  paddingInline: vars.space.md,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  flexShrink: 0,
  // Header FIXO full-width (mesmo padrão da tela Incluir Contrato): logo abaixo do topbar do sistema,
  // da barra de menu à direita.
  position: 'fixed',
  insetBlockStart: vars.size.topbar,
  insetInlineStart: 'var(--sidebar-width, 16.25rem)',
  insetInlineEnd: 0,
  zIndex: 100,
  background: vars.color.surface.default,
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
  padding: `0.1875rem ${vars.space.sm}`,
  borderRadius: vars.radius.md, // cantos médios (alinhado às badges do grid)
  fontFamily: vars.font.family.heading, // brand: Inter (badges)
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.semibold,
  // Caixa alta + letter-spacing alinhados ao padrão das badges do grid.
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
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

// Cancelado (§1.7) — badge NEUTRA/cinza (token cancelled*), distinta do vermelho do distrato.
export const statusBadgeCancelled = style({
  background: vars.color.status.cancelledBg,
  color: vars.color.status.cancelledText,
})

// "Homologado" — badge BRANCA (fundo branco + borda hairline + texto institucional), por pedido da stakeholder.
export const statusBadgeHomologado = style({
  background: vars.color.surface.default,
  color: vars.color.institutional.ink2,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

/* ── Layout principal 2 colunas ── */
export const mainLayout = style({
  display: 'flex',
  flex: 1,
  gap: vars.space.xl,
  minHeight: 0,
  overflow: 'hidden',
  // Reserva a altura do header agora fixo (mantém o corpo na mesma posição de antes).
  paddingBlockStart: '3.5rem',
})

export const mainCol = style({
  flex: 1,
  minWidth: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingTop: vars.space.lg,
  paddingInlineStart: vars.space.md,
  paddingInlineEnd: vars.space.xs,
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
  gap: '1.75rem', // um pouco mais de respiro entre as sections
  padding: vars.space.lg,
  paddingBottom: '4rem',
  overflowY: 'auto',
  overflowX: 'hidden',
  background: vars.color.surface.default,
  borderInlineStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
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
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: vars.font.family.heading, // brand: Inter (badge)
  fontSize: '0.5625rem',
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.06em',
  padding: `0.1875rem ${vars.space.sm}`,
  borderRadius: vars.radius.md, // cantos médios (alinhado às badges do grid)
  textTransform: 'uppercase',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
})

// Cor por TIPO de parceiro (azul/amarelo/verde/laranja) — chaveada pelo `contractType` (EN).
export const overlinePillTone = styleVariants({
  Supplier: {
    color: vars.color.partnerType.supplier.text,
    background: vars.color.partnerType.supplier.background,
  },
  Financier: {
    color: vars.color.partnerType.financier.text,
    background: vars.color.partnerType.financier.background,
  },
  Collaborator: {
    color: vars.color.partnerType.collaborator.text,
    background: vars.color.partnerType.collaborator.background,
  },
  ACT: { color: vars.color.partnerType.act.text, background: vars.color.partnerType.act.background },
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
  marginInlineStart: vars.space.xs,
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

// Modificador: remove a linha inferior (usado na última seção — Contato).
export const sectionBlockFlush = style({ borderBottom: 'none' })

/* Edição inline do Contato */
export const editInput = style({
  inlineSize: '100%',
  boxSizing: 'border-box',
  blockSize: '2.25rem',
  paddingInline: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  selectors: {
    '&:focus': {
      outline: 'none',
      borderColor: vars.color.institutional.blue,
    },
  },
})

export const editTextarea = style([
  editInput,
  {
    blockSize: 'auto',
    minBlockSize: '4rem',
    paddingBlock: vars.space.sm,
    resize: 'vertical',
  },
])

export const editActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  marginBlockStart: vars.space.sm,
})

export const editError = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.feedback.errorText,
  marginBlockStart: vars.space.sm,
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
  marginInlineStart: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  blockSize: '2.125rem', // um pouco menor
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blue,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default, // sem preenchimento (estilo anterior)
  cursor: 'pointer',
  transition: 'background 120ms, border-color 120ms',
  ':hover': {
    borderColor: vars.color.institutional.blueLine,
    background: vars.color.institutional.blueBg,
  },
  selectors: {
    '&:disabled': {
      opacity: 0.45,
      cursor: 'not-allowed',
      color: vars.color.institutional.ink5,
    },
    // sem hover quando desabilitado
    '&:disabled:hover': {
      borderColor: vars.color.institutional.paperRule,
      background: vars.color.surface.default,
    },
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
    marginInlineEnd: vars.space.sm,
    opacity: 0.7,
  },
})

export const fldBoxSelect = style({
  '::after': {
    content: '"\\25BE"',
    color: vars.color.institutional.blue,
    fontSize: '0.625rem',
    marginInlineStart: vars.space.sm,
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

// Larguras espelhando a wireframe (Nº · Tipo · Assinatura · Resumo · Impacto · Status · Doc);
// Impacto mais largo p/ caber "+ 31/12/2026" (nova vigência do aditivo de prazo).
const aditGridCols = '6.875rem 4.5rem 5.625rem 1fr 8.5rem 6.75rem 3.75rem'

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
    // Hover em todas as linhas de dados (a head já é paperWarm, então não muda). Wireframe.
    '&:hover': { background: vars.color.institutional.paperWarm },
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
  fontFamily: vars.font.family.heading, // brand: Inter (títulos da tabela)
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
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.01em',
})

export const aditData = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink3,
  fontVariantNumeric: 'tabular-nums',
})

export const aditResumo = style({
  fontFamily: vars.font.family.body, // brand: Nunito (coluna RESUMO)
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const aditImpacto = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
})
export const aditImpactoPos = style({
  color: vars.color.institutional.greenDeep,
  fontWeight: vars.font.weight.semibold,
})
export const aditImpactoNeg = style({
  color: vars.color.status.distratoText,
  fontWeight: vars.font.weight.semibold,
}) // supressão (reduz valor)
export const aditImpactoBase = style({
  color: vars.color.institutional.ink2,
  fontWeight: vars.font.weight.semibold,
})
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
  textDecoration: 'none',
  transition: 'background 120ms, color 120ms',
  ':hover': { background: vars.color.institutional.blueBg, color: vars.color.institutional.blueDeep },
  selectors: {
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
    '&:disabled:hover': { background: 'transparent', color: vars.color.institutional.ink4 },
  },
})

/* Timeline (sidebar) — linha vertical + marcadores (wireframe) */
export const tlWrap = style({ display: 'flex', flexDirection: 'column' })

export const tlItem = style({
  position: 'relative',
  padding: `${vars.space.sm} 0 ${vars.space.sm} 1.125rem`,
  fontSize: '0.6875rem',
  borderInlineStart: `${vars.borderWidth.thick} solid ${vars.color.institutional.paperRule}`,
  marginInlineStart: '0.3125rem',
  '::before': {
    content: '""',
    position: 'absolute',
    insetInlineStart: '-0.3125rem',
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

// Nó do contrato BASE (assinatura): preto (ink2), espelhando a cor do badge "BASE" — cor por tipo.
export const tlItemBase = style({
  '::before': { borderColor: vars.color.institutional.ink2, background: vars.color.institutional.ink2 },
})

export const tlItemCurrent = style({
  '::before': { borderColor: vars.color.institutional.orange, background: vars.color.institutional.orange },
})

export const tlDate = style({
  fontFamily: vars.font.family.body, // brand: Nunito
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink5,
  marginBottom: '0.125rem',
  letterSpacing: '0.02em',
})

export const tlText = style({
  fontFamily: vars.font.family.body, // brand: Nunito
  color: vars.color.institutional.ink2,
  lineHeight: 1.45,
})

/* Paginador da tabela de aditivos (aparece quando > 5 aditivos). */
export const aditPaginator = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  paddingBlockStart: vars.space.sm,
})

export const aditPageBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.75rem',
  blockSize: '1.75rem',
  borderRadius: vars.radius.sm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink3,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  lineHeight: 1,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.institutional.paperWarm },
    '&:disabled': { opacity: '0.4', cursor: 'not-allowed' },
  },
})

export const aditPageInfo = style({
  fontFamily: vars.font.family.body, // brand: Nunito
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink4,
  minInlineSize: '2.5rem',
  textAlign: 'center',
})

// Nó da timeline na cor do TIPO de aditivo, espelhando exatamente o badge do documento:
// prazo azul · valor verde · escopo MARROM (aditEscopo) · outro LARANJA (aditOutro) · distrato vermelho.
// Definido DEPOIS de `tlItem`/`tlItemOk` p/ vencer por ordem de fonte (mesma especificidade de classe).
export const tlNodeTone = styleVariants({
  prazo: {
    '::before': { borderColor: vars.color.status.prazoText, background: vars.color.status.prazoText },
  },
  valor: {
    '::before': { borderColor: vars.color.status.valorText, background: vars.color.status.valorText },
  },
  escopo: {
    '::before': {
      borderColor: vars.color.status.aditEscopoText,
      background: vars.color.status.aditEscopoText,
    },
  },
  distrato: {
    '::before': { borderColor: vars.color.status.distratoText, background: vars.color.status.distratoText },
  },
  outro: {
    '::before': { borderColor: vars.color.status.aditOutroText, background: vars.color.status.aditOutroText },
  },
})

// Nó do contrato FINALIZADO: mesma cor da badge "Finalizado" (finishedText).
export const tlItemFinished = style({
  '::before': { borderColor: vars.color.status.finishedText, background: vars.color.status.finishedText },
})

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
  insetInlineStart: 'var(--sidebar-width, 16.25rem)',
  insetInlineEnd: 0,
  zIndex: 100,
})

export const bottombarStatus = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.body, // brand: Nunito ("Sincronizado")
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
  marginInlineStart: 'auto',
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

/* ── Badge de TIPO de aditivo (wireframe: UPPERCASE, weight 700, 9px, cantos suaves) ── */
export const docBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `0.1875rem ${vars.space.sm}`,
  borderRadius: vars.radius.md, // cantos médios (alinhado às badges do grid)
  fontFamily: vars.font.family.heading, // brand: Inter (badges)
  fontSize: '0.5625rem',
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.05em',
  lineHeight: 1.2,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
})

export const docBadgeBase = style({
  background: vars.color.institutional.ink2, // BASE (contrato) preto, conforme wireframe
  color: vars.color.surface.default,
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
  background: vars.color.status.aditEscopoBg,
  color: vars.color.status.aditEscopoText,
})

export const docBadgeDistrato = style({
  background: vars.color.status.distratoBg,
  color: vars.color.status.distratoText,
})

export const docBadgeOutro = style({
  background: vars.color.status.aditOutroBg,
  color: vars.color.status.aditOutroText,
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
  fontSize: '0.6875rem', // +1px
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: vars.color.institutional.ink2, // preto
  marginBottom: vars.space.sm,
})

// Overline do "Valor Atual" (sb-hero) — mono, como na wireframe (distinto dos h4 de seção em Inter).
export const asideOverline = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6625rem', // +1px
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.1em',
  color: vars.color.institutional.ink2, // preto
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
  fontFamily: vars.font.family.mono, // mesma fonte de Número/Assinatura (melhor p/ números)
  fontSize: '0.75rem', // −2px sobre sm
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
  fontFamily: vars.font.family.mono, // mesma fonte de Número/Assinatura (melhor p/ números)
  fontSize: '0.75rem', // −2px sobre sm
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
  insetInlineStart: 0,
  height: '100%',
  background: vars.color.institutional.blue,
  borderRadius: vars.radius.lg,
})

export const vigenciaBarLabels = style({
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: vars.font.family.body, // brand: Nunito
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink5,
})

export const vigenciaAlert = style({
  fontFamily: vars.font.family.heading,
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
