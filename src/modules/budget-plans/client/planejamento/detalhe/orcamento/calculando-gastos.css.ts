/**
 * Estilos do modal "Calculando Gastos" no padrão visual "brand" (mock `calculando-gastos-brand`): overlay escuro
 * + card branco (radius 18) em LARGURA CHEIA (sem coluna central estreita — pedido da P.O.), titlebar + breadcrumb,
 * abas por Tipo de lançamento com setas ‹ ›, corpo com 3 colunas (Categoria/Subcategoria/Despesas) sobre fundo frio,
 * rodapé "Calcular", e o DRAWER lateral direito onde os forms de edição passam a abrir. Cores/px fora do kit vivem
 * em `calculando-gastos.values.ts`; o resto vem de `brand`. Fonte Inter (`vars.font.family.heading`). Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { calcGastos as cg } from './calculando-gastos.values.ts'

// ── Overlay + modal (largura cheia com margem pequena) ──
export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  background: cg.color.overlay,
  display: 'flex',
  padding: cg.size.modalMargin,
})

export const panel = style({
  inlineSize: '100%',
  margin: 'auto',
  // Altura FIXA (não `max`): o modal não muda de tamanho ao trocar de centro de custo (abas) nem ao
  // selecionar categorias — o corpo rola internamente. Antes `maxBlockSize` fazia o modal crescer/encolher.
  blockSize: `calc(100vh - (${cg.size.modalMargin} * 2))`,
  background: brand.color.surface,
  borderRadius: cg.size.modalRadius,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: vars.font.family.heading, // Inter
  color: brand.color.ink700,
  boxShadow: cg.shadow.modal,
})

// ── Titlebar ──
export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  paddingInline: cg.size.titlebarPadInline,
  blockSize: cg.size.titlebarH,
  flexShrink: 0,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

export const headerTitle = style({
  margin: 0,
  fontSize: brand.text.panelTitle,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const headerCrumb = style({
  color: brand.color.ink500,
  fontWeight: brand.weight.medium,
})

export const closeButton = style({
  marginInlineStart: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: cg.size.closeBox,
  blockSize: cg.size.closeBox,
  borderRadius: brand.radius.sm,
  border: 'none',
  background: 'transparent',
  color: brand.color.ink500,
  fontSize: brand.text.panelTitle,
  lineHeight: 1,
  cursor: 'pointer',
  transition: `background ${brand.ease}, color ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.surfaceAlt, color: brand.color.ink900 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// ── Abas (setas ‹ › + abas por Tipo de lançamento) ──
export const tabsBar = style({
  display: 'flex',
  alignItems: 'stretch',
  flexShrink: 0,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

export const tabsScroll = style({
  display: 'flex',
  flex: 1,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  selectors: { '&::-webkit-scrollbar': { display: 'none' } },
})

export const tab = style({
  flex: 1,
  minInlineSize: 'max-content',
  blockSize: cg.size.tabH,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingInline: brand.space.lg,
  border: 'none',
  borderBlockEnd: `${vars.borderWidth.thick} solid transparent`,
  background: 'transparent',
  color: brand.color.ink500,
  fontSize: cg.size.tabFont,
  fontWeight: brand.weight.semibold,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: `color ${brand.ease}, background ${brand.ease}`,
  selectors: {
    '&:hover': { color: brand.color.ink700, background: brand.color.surfaceAlt },
  },
})

export const tabActive = style({
  background: brand.color.primary,
  color: brand.color.surface,
  borderRadius: `${cg.size.tabRadius} ${cg.size.tabRadius} 0 0`,
  borderBlockEndColor: brand.color.primary,
  selectors: { '&:hover': { background: brand.color.primary, color: brand.color.surface } },
})

export const navButton = style({
  inlineSize: cg.size.tabNavW,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  border: 'none',
  background: 'transparent',
  color: brand.color.ink400,
  fontSize: brand.text.panelTitle,
  lineHeight: 1,
  cursor: 'pointer',
  transition: `color ${brand.ease}`,
  selectors: {
    '&:hover:not(:disabled)': { color: brand.color.ink700 },
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
  },
})

// ── Corpo: fundo frio + 3 colunas ──
export const columns = style({
  flex: 1,
  padding: cg.size.bodyPad,
  overflowY: 'auto',
  background: cg.color.pageBg,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1.05fr',
  alignItems: 'start',
  gap: cg.size.colsGap,
  scrollbarWidth: 'thin',
  scrollbarColor: `${cg.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.625rem' },
    '&::-webkit-scrollbar-thumb': { background: cg.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

export const column = style({
  // min-inline-size 0: item de grid não transborda a track (default `auto`) — nomes longos ficam contidos
  // na coluna, sem sobrepor a coluna vizinha. `overflow:hidden` reforça o clamp.
  minInlineSize: 0,
  overflow: 'hidden',
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: cg.size.colRadius,
  boxShadow: brand.shadow.card,
  padding: cg.size.colPad,
})

export const columnHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  marginBlockEnd: brand.space.lg,
})

export const columnTitle = style({
  margin: 0,
  textAlign: 'center',
  fontSize: cg.size.colTitleFont,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const infoButton = style({
  position: 'absolute',
  insetInlineEnd: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: brand.color.ink400,
  cursor: 'pointer',
})

export const list = style({ display: 'flex', flexDirection: 'column', gap: brand.space.sm })

export const item = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.sm,
  inlineSize: '100%',
  paddingBlock: cg.size.litemPadBlock,
  paddingInline: cg.size.litemPadInline,
  borderRadius: cg.size.litemRadius,
  background: brand.color.surfaceAlt,
  border: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  color: brand.color.ink700,
  fontSize: cg.size.litemFont,
  fontWeight: brand.weight.semibold,
  textAlign: 'left',
  cursor: 'pointer',
  transition: `border-color ${brand.ease}`,
  selectors: {
    '&:hover': { borderColor: cg.color.itemHoverBorder },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: `calc(-1 * ${vars.focusRing.width})`,
    },
  },
})

export const itemActive = style({
  background: brand.color.primary,
  borderColor: brand.color.primary,
  color: brand.color.surface,
  selectors: { '&:hover': { borderColor: brand.color.primary } },
})

// Nome do item: ocupa o espaço e trunca com reticências (não transborda/sobrepõe o chevron nem a coluna).
export const itemName = style({
  flex: 1,
  minInlineSize: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const chevron = style({ flexShrink: 0, opacity: 0.55 })

// ── Linhas de mês (Despesas), zebra ──
export const despesaRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.sm,
  paddingBlock: cg.size.mrowPadBlock,
  paddingInline: cg.size.mrowPadInline,
  borderRadius: cg.size.mrowRadius,
  selectors: {
    '&:nth-child(odd)': { background: brand.color.surfaceAlt },
  },
})

export const despesaName = style({
  minInlineSize: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: cg.size.litemFont,
  fontWeight: brand.weight.medium,
  color: brand.color.ink700,
})

// Valor + ícones: não encolhem (o nome do mês trunca antes de espremer/sobrepor).
export const despesaEnd = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  flexShrink: 0,
})

export const despesaValue = style({
  fontVariantNumeric: 'tabular-nums',
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
})

export const despesaValueZero = style({
  color: brand.color.ink400,
  fontWeight: brand.weight.medium,
})

export const iconButton = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: '1.25rem',
  blockSize: '1.25rem',
  borderRadius: brand.radius.xs,
  border: 'none',
  background: 'transparent',
  color: brand.color.ink400,
  cursor: 'pointer',
  transition: `color ${brand.ease}`,
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const iconButtonEdit = style({ selectors: { '&:hover': { color: brand.color.primary } } })
export const iconButtonDel = style({ selectors: { '&:hover': { color: cg.color.brandRed } } })

export const empty = style({
  padding: brand.space.lg,
  textAlign: 'center',
  color: brand.color.ink500,
  fontSize: brand.text.body,
})

// ── Rodapé do modal ──
export const modalFoot = style({
  display: 'flex',
  justifyContent: 'flex-end',
  paddingBlock: cg.size.footPadBlock,
  paddingInline: cg.size.footPadInline,
  flexShrink: 0,
  borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

// Botão primário (Calcular / Salvar / Aplicar) — azul da marca.
export const applyButton = style({
  blockSize: cg.size.btnH,
  paddingInline: cg.size.btnPadInline,
  border: 'none',
  borderRadius: brand.radius.sm,
  background: brand.color.primary,
  color: brand.color.surface,
  fontFamily: 'inherit',
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
  transition: `background ${brand.ease}`,
  selectors: {
    '&:hover:not(:disabled)': { background: brand.color.primaryHover },
    '&:disabled': { opacity: 0.55, cursor: 'not-allowed' },
  },
})

// Botão secundário (Cancelar / Descartar) — ghost.
export const cancelButton = style({
  blockSize: cg.size.btnH,
  paddingInline: brand.space.xl,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.sm,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: 'inherit',
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  transition: `border-color ${brand.ease}, background ${brand.ease}`,
  selectors: {
    '&:hover': { borderColor: brand.color.lineStrong, background: brand.color.surfaceAlt },
  },
})

// ── Drawer lateral direito ──
export const drawerOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 1250,
  background: cg.color.drawerOverlay,
})

export const drawer = style({
  position: 'fixed',
  insetBlock: 0,
  insetInlineEnd: 0,
  zIndex: 1251,
  inlineSize: cg.size.drawerW,
  maxInlineSize: '94vw',
  background: brand.color.surface,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: cg.size.drawerShadow,
  fontFamily: vars.font.family.heading,
})

export const drawerHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  padding: cg.size.drawerHeadPad,
  flexShrink: 0,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

export const drawerHeadInfo = style({ color: brand.color.ink400, display: 'inline-flex' })

export const drawerHeadTitle = style({
  margin: 0,
  flex: 1,
  textAlign: 'center',
  fontSize: cg.size.drawerHeadFont,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const drawerClose = style({
  inlineSize: cg.size.drawerCloseBox,
  blockSize: cg.size.drawerCloseBox,
  display: 'grid',
  placeItems: 'center',
  border: 'none',
  background: 'transparent',
  borderRadius: brand.radius.sm,
  color: brand.color.ink500,
  cursor: 'pointer',
  transition: `background ${brand.ease}, color ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.surfaceAlt, color: brand.color.ink900 },
  },
})

export const drawerBody = style({
  padding: cg.size.drawerBodyPad,
  overflowY: 'auto',
  flex: 1,
  background: cg.color.pageBg,
  scrollbarWidth: 'thin',
  scrollbarColor: `${cg.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.5rem' },
    '&::-webkit-scrollbar-thumb': { background: cg.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

export const drawerFoot = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: brand.space.sm,
  paddingBlock: cg.size.drawerFootPadBlock,
  paddingInline: cg.size.drawerFootPadInline,
  flexShrink: 0,
  borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

// ── Seções e campos de formulário (usados pelos 4 forms dentro do drawer) ──
export const configForm = style({ display: 'flex', flexDirection: 'column', gap: brand.space.gridRow })

export const configSection = style({
  background: cg.color.secBg,
  border: `${vars.borderWidth.thin} solid ${cg.color.secBorder}`,
  borderRadius: cg.size.fsecRadius,
  padding: cg.size.fsecPad,
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.md,
})

export const configSectionTitle = style({
  margin: 0,
  fontSize: cg.size.fsecTitleFont,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const field = style({ display: 'flex', flexDirection: 'column', gap: brand.space.xs })

export const fieldLabel = style({
  fontSize: cg.size.fieldLabelFont,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
})

export const fieldControl = style({ position: 'relative' })

export const fieldInput = style({
  inlineSize: '100%',
  blockSize: cg.size.fieldH,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.sm,
  background: brand.color.surface,
  paddingInline: cg.size.fieldPadInline,
  fontFamily: 'inherit',
  fontSize: brand.text.body,
  color: brand.color.ink900,
  appearance: 'none',
  transition: `border-color ${brand.ease}, box-shadow ${brand.ease}`,
  selectors: {
    '&::placeholder': { color: brand.color.ink400 },
    '&:focus': {
      outline: 'none',
      borderColor: brand.color.primary,
      boxShadow: brand.shadow.focus,
    },
  },
})

// Select (chevron desenhado à direita, sem seta nativa).
export const fieldSelect = style({
  cursor: 'pointer',
  paddingInlineEnd: '2.25rem',
})

export const fieldChevron = style({
  position: 'absolute',
  insetInlineEnd: cg.size.fieldChevInset,
  insetBlockStart: '50%',
  transform: 'translateY(-50%)',
  color: brand.color.ink400,
  pointerEvents: 'none',
  display: 'inline-flex',
})

// Input somente-leitura (derivados: Salário Total, Total Encargos…).
export const derivedInput = style([
  fieldInput,
  {
    background: cg.color.readonlyBg,
    color: brand.color.ink700,
    fontWeight: brand.weight.semibold,
    display: 'flex',
    alignItems: 'center',
    fontVariantNumeric: 'tabular-nums',
  },
])

export const totalBox = style({
  background: cg.color.tintBlue,
  borderRadius: brand.radius.sm,
  padding: cg.size.totalboxPad,
  textAlign: 'center',
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  fontSize: cg.size.totalboxFont,
  fontVariantNumeric: 'tabular-nums',
})

// ── Checkbox rows (Aplicar aos meses) ──
export const checkRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  paddingBlock: cg.size.checkRowPadBlock,
  color: brand.color.ink700,
  fontWeight: brand.weight.medium,
  cursor: 'pointer',
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  selectors: { '&:last-child': { borderBlockEnd: 'none' } },
})

export const checkbox = style({
  inlineSize: cg.size.checkbox,
  blockSize: cg.size.checkbox,
  accentColor: brand.color.primary,
  cursor: 'pointer',
  margin: 0,
  flexShrink: 0,
})

// ── Pills de mês ──
export const mesesRow = style({ display: 'flex', flexWrap: 'wrap', gap: brand.space.xs })

export const mesChip = style({
  inlineSize: cg.size.mpillW,
  paddingBlock: cg.size.mpillPadBlock,
  textAlign: 'center',
  borderRadius: cg.size.mpillRadius,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink500,
  fontWeight: brand.weight.semibold,
  fontSize: cg.size.mpillFont,
  cursor: 'pointer',
  transition: `border-color ${brand.ease}`,
  selectors: { '&:hover': { borderColor: cg.color.itemHoverBorder } },
})

export const mesChipOn = style({
  background: brand.color.primary,
  borderColor: brand.color.primary,
  color: brand.color.surface,
  selectors: { '&:hover': { borderColor: brand.color.primary } },
})

export const labelMini = style({
  margin: `0 0 ${brand.space.xs}`,
  fontSize: cg.size.labelMiniFont,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
})

// ── Caixas de resumo (sumbox) ──
export const sumRow = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: brand.space.md })

export const sumBox = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: cg.size.sumboxRadius,
  padding: cg.size.sumboxPad,
  textAlign: 'center',
})

export const sumBoxLabel = style({ fontSize: cg.size.sumboxLabelFont, color: brand.color.ink500 })

export const sumBoxValue = style({
  marginBlockStart: brand.space.xxs,
  fontSize: cg.size.sumboxValFont,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
})

// ── Modal de confirmação de descarte ──
export const confirmOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 1300,
  background: cg.color.overlay,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: brand.space.lg,
})

export const confirmDialog = style({
  inlineSize: '100%',
  maxInlineSize: '26rem',
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.md,
  padding: brand.space.xl,
  borderRadius: brand.radius.lg,
  background: brand.color.surface,
  fontFamily: vars.font.family.heading,
})

export const confirmTitle = style({
  margin: 0,
  fontSize: brand.text.panelTitle,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const confirmBody = style({
  margin: 0,
  fontSize: brand.text.body,
  color: brand.color.ink500,
  lineHeight: 1.5,
})

export const confirmFooter = style({ display: 'flex', gap: brand.space.sm, justifyContent: 'flex-end' })

export const confirmKeep = style({
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.md,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  fontFamily: 'inherit',
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  selectors: { '&:hover': { background: brand.color.surfaceAlt } },
})

export const confirmDiscard = style({
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.md,
  borderRadius: brand.radius.sm,
  border: 'none',
  background: cg.color.brandRed,
  color: brand.color.surface,
  fontFamily: 'inherit',
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  selectors: { '&:hover': { opacity: 0.9 } },
})
