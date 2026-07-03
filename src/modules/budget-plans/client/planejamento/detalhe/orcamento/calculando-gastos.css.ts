/**
 * Estilos do modal "Calculando Gastos" (US2.4b): overlay full-screen, barra de abas (centros de custo) e
 * 3 colunas (Categoria / Subcategoria / Despesas). Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  background: vars.color.institutional.overlay,
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
})

export const panel = style({
  inlineSize: '100%',
  blockSize: '100%',
  background: vars.color.surface.default,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: vars.font.family.body,
  overflow: 'hidden',
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.surface.subtle,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const headerTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const closeButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.default, color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const tabsBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingInline: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const tabsScroll = style({
  display: 'flex',
  flex: 1,
  overflowX: 'auto',
})

export const tab = style({
  flex: 1,
  minInlineSize: 'max-content',
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  border: 'none',
  borderBlockEnd: `${vars.borderWidth.thick} solid transparent`,
  background: 'transparent',
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
  },
})

export const tabActive = style({
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  borderBlockEndColor: vars.color.brand.normal,
  selectors: { '&:hover': { background: vars.color.brand.hover } },
})

export const navButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  flexShrink: 0,
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.primary,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.surface.subtle },
    '&:disabled': { opacity: 0.3, cursor: 'not-allowed' },
  },
})

export const columns = style({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  // Cada coluna dimensiona pela PRÓPRIA altura (fit-content) — evita cards vazios altos ao rolar.
  alignItems: 'start',
  gap: vars.space.lg,
  padding: vars.space.lg,
  // Folga no fim para o conteúdo não ficar atrás da barra de ações fixa (formActions).
  paddingBlockEnd: `calc(${vars.space.xl} * 2.5)`,
  overflowY: 'scroll',
  // Barra de rolagem sempre visível (fina, tingida pela marca).
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.border.default} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.625rem' },
    '&::-webkit-scrollbar-thumb': {
      background: vars.color.border.default,
      borderRadius: vars.radius.md,
    },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

export const column = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
  minBlockSize: 0,
})

export const columnTitle = style({
  margin: 0,
  textAlign: 'center',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
})

export const list = style({ display: 'flex', flexDirection: 'column', gap: vars.space.sm })

export const item = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: 'none',
  background: `color-mix(in srgb, ${vars.color.brand.normal} 8%, white)`,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  textAlign: 'left',
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: `color-mix(in srgb, ${vars.color.brand.normal} 16%, white)` },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: `calc(-1 * ${vars.focusRing.width})`,
    },
  },
})

export const itemActive = style({
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  selectors: { '&:hover': { background: vars.color.brand.hover } },
})

export const chevron = style({ flexShrink: 0, opacity: 0.7 })

export const despesaRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 6%, white)`,
})

export const despesaName = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const despesaEnd = style({ display: 'flex', alignItems: 'center', gap: vars.space.xs })

export const despesaValue = style({
  fontVariantNumeric: 'tabular-nums',
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

export const despesaInput = style({
  inlineSize: '7rem',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.sm,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
})

export const iconButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.5rem',
  blockSize: '1.5rem',
  borderRadius: vars.radius.sm,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle, color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const empty = style({
  padding: vars.space.lg,
  textAlign: 'center',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
})

// ── Form "Configuração" (abre no lápis) ──
export const columnHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
})

export const infoButton = style({
  position: 'absolute',
  insetInlineEnd: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  cursor: 'pointer',
})

export const configForm = style({ display: 'flex', flexDirection: 'column', gap: vars.space.md })

export const configSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 6%, white)`,
})

export const configSectionTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.04em',
  color: vars.color.text.secondary,
})

export const switchRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  cursor: 'pointer',
})

export const field = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs })

export const fieldLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})

export const fieldInput = style({
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const custoTotalBox = style({
  marginBlockStart: vars.space.xs,
  paddingBlock: vars.space.sm,
  textAlign: 'center',
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 22%, white)`,
  color: vars.color.text.primary,
  fontWeight: vars.font.weight.bold,
  fontVariantNumeric: 'tabular-nums',
})

export const checkRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingBlock: vars.space.xs,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  cursor: 'pointer',
  borderBlockEnd: `${vars.borderWidth.thin} solid color-mix(in srgb, ${vars.color.brand.normal} 20%, transparent)`,
})

// Rodapé fixo — mesmo padrão da tela "Incluir contrato" (barra branca full-width, botões à direita).
// O modal é full-screen (cobre a sidebar), então `inset-inline: 0` = borda a borda.
export const formActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.md,
  blockSize: '3.5rem',
  paddingInline: vars.space.lg,
  background: vars.color.surface.default,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  flexShrink: 0,
  position: 'fixed',
  insetBlockEnd: 0,
  insetInline: 0,
  zIndex: 1250,
})

// Botão secundário (Cancelar/Descartar) — igual ao "Incluir contrato".
export const cancelButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  blockSize: '2.5rem',
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink4,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  cursor: 'pointer',
  transition: 'background 150ms, border-color 150ms',
  selectors: {
    '&:hover': {
      background: vars.color.institutional.blueBg,
      borderColor: vars.color.institutional.blueLine,
    },
  },
})

// Botão primário (Aplicar/Salvar) — igual ao "Incluir contrato" (azul institucional).
export const applyButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  blockSize: '2.5rem',
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.institutional.blue,
  color: vars.color.surface.default,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  cursor: 'pointer',
  transition: 'background 150ms, box-shadow 150ms',
  selectors: { '&:hover': { background: vars.color.institutional.blueDeep } },
})

// ── Modal de confirmação de descarte (Cancelar no form) ──
export const confirmOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 1300,
  background: vars.color.institutional.overlay,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.lg,
})

export const confirmDialog = style({
  inlineSize: '100%',
  maxInlineSize: '26rem',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  fontFamily: vars.font.family.body,
})

export const confirmTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const confirmBody = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  lineHeight: 1.5,
})

export const confirmFooter = style({ display: 'flex', gap: vars.space.sm, justifyContent: 'flex-end' })

export const confirmKeep = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: { '&:hover': { background: vars.color.surface.subtle } },
})

export const confirmDiscard = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.feedback.errorText,
  color: vars.color.surface.default,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: { '&:hover': { opacity: 0.9 } },
})
