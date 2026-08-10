/**
 * Estilos reutilizáveis do FORMULÁRIO "brand" (mock `novo-colaborador-brand`): página cinza full-bleed,
 * cabeçalho com botão voltar + título, cards de seção (header com ícone tintado + corpo), grade de campos
 * (label/control/input/select/textarea/chevron/hint) e barra de ações fixa (ghost/primary). Espelha a
 * identidade do KIT de grid (`grid-brand.values.ts`). Cada tela de criação/edição importa daqui e a rota
 * deve ser marcada em `root.view-model → fullBleedContent` para o shell zerar o padding.
 *
 * px/hex CRUS ficam no `grid-brand.values.ts` (isento); aqui só consumimos `brand.*` e `vars.*`.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

import { brand } from './grid-brand.values.ts'

// Container full-bleed: coluna flex que preenche a área de conteúdo do shell; o corpo rola, a barra de ações
// fica fixa embaixo. Fundo cinza da identidade encosta nas bordas (rota em `fullBleedContent`).
export const page = style({
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100%',
  minBlockSize: 0,
  overflow: 'hidden',
  background: brand.color.pageBg,
  fontFamily: vars.font.family.heading, // Inter
  color: brand.color.ink700,
})

// Região que ROLA (o cabeçalho rola junto, como no mock). Scrollbar visível (macOS auto-esconde a nativa).
export const scrollArea = style({
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.625rem' },
    '&::-webkit-scrollbar-thumb': { background: brand.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

// Conteúdo ocupa toda a largura disponível (pedido da P.O. — sem coluna central limitada). O padding
// inferior generoso libera espaço para a barra de ações fixa.
export const content = style({
  paddingBlock: `${brand.space.xxl} 7.5rem`,
  paddingInline: brand.space.xxl,
})

// ── Cabeçalho (voltar + título) ──
export const head = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.lg,
  marginBlockEnd: vars.space.xl,
})

export const backBtn = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: brand.size.backBtn,
  blockSize: brand.size.backBtn,
  flex: 'none',
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  borderRadius: brand.radius.sm,
  color: brand.color.primary,
  cursor: 'pointer',
  transition: `background ${brand.ease}, border-color ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.surfaceAlt, borderColor: brand.color.lineStrong },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const headTitle = style({
  margin: 0,
  fontSize: brand.text.h1,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  letterSpacing: '-.01em',
})

// Título + subtítulo empilhados (ex.: nome do colaborador + status do cadastro na tela de detalhe).
export const headText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xxs,
  minInlineSize: 0,
})

export const headSubtitle = style({
  margin: 0,
  fontSize: brand.text.subtitle,
  color: brand.color.ink400,
})

// Ações à direita do cabeçalho (ex.: Exportar histórico).
export const headActions = style({
  marginInlineStart: 'auto',
  display: 'flex',
  gap: brand.space.sm,
  flex: 'none',
})

export const headMeta = style({
  display: 'inline-flex',
  alignItems: 'center',
  marginInlineStart: brand.space.md,
  paddingBlock: brand.space.xxs,
  paddingInline: brand.space.sm,
  borderRadius: brand.radius.xs,
  border: `${vars.borderWidth.thin} solid ${brand.color.cadBg}`,
  background: brand.color.cadBg,
  color: brand.color.cadFg,
  fontFamily: vars.font.family.mono,
  fontSize: brand.text.hint,
  fontWeight: brand.weight.semibold,
})

// Título com meta na mesma linha (ex.: "Novo Contrato  CT 0001/2026").
export const headTitleRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: brand.space.xs,
})

// ── Card de seção ──
export const sectionCard = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  marginBlockEnd: vars.space.lg,
  overflow: 'hidden',
})

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  paddingBlock: vars.space.md,
  paddingInline: brand.space.xl,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  background: brand.color.surfaceAlt,
})

export const sectionIcon = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: brand.size.sectionIconBox,
  blockSize: brand.size.sectionIconBox,
  flex: 'none',
  borderRadius: brand.radius.iconSm,
  background: brand.color.cadBg,
  color: brand.color.primary,
})

export const sectionH2 = style({
  margin: 0,
  fontSize: brand.text.sectionH2,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const sectionBody = style({
  padding: brand.space.xl,
})

// ── Grade de campos (4 colunas → 2 → 1) ──
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: `${brand.space.gridRow} ${vars.space.lg}`,
  '@media': {
    'screen and (max-width: 1080px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
    'screen and (max-width: 640px)': { gridTemplateColumns: '1fr' },
  },
})

// Campo ocupando 2 colunas (metade numa grade de 4). Colapsa para 1 no mobile.
export const colSpan2 = style({
  gridColumn: 'span 2',
  '@media': {
    'screen and (max-width: 640px)': { gridColumn: 'span 1' },
  },
})

// Campo ocupando a linha inteira (objetivo/observações).
export const colSpanFull = style({
  gridColumn: '1 / -1',
})

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xs,
  minInlineSize: 0,
})

export const fieldLabel = style({
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
})

export const req = style({
  color: brand.color.reqStar,
  marginInlineStart: brand.space.xxs,
})

export const control = style({
  position: 'relative',
})

const controlBase = {
  inlineSize: '100%',
  blockSize: brand.size.field,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.sm,
  background: brand.color.surface,
  paddingInline: vars.space.md,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  color: brand.color.ink900,
  transition: `border-color ${brand.ease}, box-shadow ${brand.ease}`,
  appearance: 'none',
  boxSizing: 'border-box',
} as const

export const input = style({
  ...controlBase,
  selectors: {
    '&::placeholder': { color: brand.color.ink400 },
    '&:focus': {
      outline: 'none',
      borderColor: brand.color.primary,
      boxShadow: brand.shadow.focus,
    },
    '&:disabled': {
      background: brand.color.surfaceAlt,
      color: brand.color.ink400,
      cursor: 'not-allowed',
    },
  },
})

export const select = style({
  ...controlBase,
  cursor: 'pointer',
  paddingInlineEnd: '2.375rem', // 38px — espaço do chevron
  selectors: {
    '&:focus': {
      outline: 'none',
      borderColor: brand.color.primary,
      boxShadow: brand.shadow.focus,
    },
    '&:invalid': { color: brand.color.ink400 },
    '&:disabled': {
      background: brand.color.surfaceAlt,
      color: brand.color.ink400,
      cursor: 'not-allowed',
    },
  },
})

export const textarea = style({
  ...controlBase,
  blockSize: 'auto',
  minBlockSize: brand.size.field,
  paddingBlock: brand.space.sm,
  lineHeight: 1.45,
  resize: 'none',
  overflow: 'hidden',
  selectors: {
    '&::placeholder': { color: brand.color.ink400 },
    '&:focus': {
      outline: 'none',
      borderColor: brand.color.primary,
      boxShadow: brand.shadow.focus,
    },
    '&:disabled': {
      background: brand.color.surfaceAlt,
      color: brand.color.ink400,
      cursor: 'not-allowed',
    },
  },
})

// Estado de erro (borda vermelha) aplicável a input/select/textarea via className extra.
export const controlError = style({
  borderColor: brand.color.dangerFg,
  selectors: {
    '&:focus': { borderColor: brand.color.dangerFg, boxShadow: 'none' },
  },
})

export const chevron = style({
  position: 'absolute',
  insetInlineEnd: brand.space.md,
  insetBlockStart: '50%',
  transform: 'translateY(-50%)',
  color: brand.color.ink400,
  pointerEvents: 'none',
  display: 'grid',
  placeItems: 'center',
})

export const hint = style({
  fontSize: brand.text.hint,
  color: brand.color.ink500,
})

export const fieldError = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.xs,
  fontSize: brand.text.hint,
  color: brand.color.dangerFg,
})

// ── Barra de ações fixa ──
export const actionbar = style({
  position: 'fixed',
  insetInlineStart: 'var(--sidebar-width, 16.25rem)',
  insetInlineEnd: 0,
  insetBlockEnd: 0,
  zIndex: 15,
  background: brand.color.surface,
  borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  boxShadow: brand.shadow.actionbar,
  paddingBlock: brand.space.lg,
  paddingInline: brand.space.xxl,
})

// Botões alinhados à direita real da tela (sem coluna central), como no formulário anterior.
export const actionbarInner = style({
  inlineSize: '100%',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: brand.space.md,
})

const actionBtnBase = {
  blockSize: brand.size.field,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: brand.space.sm,
  borderRadius: brand.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: `background ${brand.ease}, border-color ${brand.ease}`,
} as const

export const btnPrimary = style({
  ...actionBtnBase,
  paddingInline: brand.space.xl,
  border: 'none',
  background: brand.color.primary,
  color: brand.color.surface,
  boxShadow: brand.shadow.btn,
  selectors: {
    '&:hover:not(:disabled)': { background: brand.color.primaryHover },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const btnGhost = style({
  ...actionBtnBase,
  paddingInline: brand.space.xl,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink700,
  selectors: {
    '&:hover:not(:disabled)': { background: brand.color.surfaceAlt, borderColor: brand.color.lineStrong },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// ── Layout de 2 colunas (formulário + trilho lateral) — particularidade opcional (ex.: contrato tem
// Valor/Vigência/Pendências). Colapsa para 1 coluna no mobile. Telas single-column (novo colaborador)
// simplesmente não usam este helper. ──
export const mainGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 19rem',
  gap: vars.space.xl,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 1080px)': { gridTemplateColumns: '1fr' },
  },
})

export const rail = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  position: 'sticky',
  insetBlockStart: brand.space.xxl,
})

// Card genérico do trilho (mesmo material dos cards de seção, com corpo mais compacto).
export const railCard = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  padding: brand.space.xl,
})

export const railLabel = style({
  margin: 0,
  marginBlockEnd: brand.space.md,
  fontSize: brand.text.label,
  fontWeight: brand.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: brand.color.ink500,
})
