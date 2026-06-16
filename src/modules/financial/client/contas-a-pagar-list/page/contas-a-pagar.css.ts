/**
 * Contas a Pagar (grid) — estilos (vanilla-extract, só-tokens §X). Fiel ao Figma 205-638 / mock: filter-bar
 * (busca + status-chips segmented-control), grid de 6 colunas (DTO fino) com tipografia densa Inter +
 * valores mono, e bottombar (footer no padrão Contratos: paginação + Novo Documento). Marca azul do DS.
 */
import { style, styleVariants, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: '100%',
  paddingBlockEnd: '5rem', // espaço p/ o bottombar fixo
})

// ── Filter-bar (Figma): busca + status-chips ──────────────────────────────────
export const filterBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.875rem', // Figma: 14px
  paddingInline: vars.space.lg, // 24px
  paddingBlock: vars.space.sm,
  background: vars.color.surface.default,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const searchWrap = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  paddingBlock: '0.375rem', // 6px
  paddingInlineStart: '2rem', // 32px (espaço do ícone)
  paddingInlineEnd: '0.6875rem', // 11px
  minInlineSize: '17.5rem', // 280px
  maxInlineSize: '21.25rem', // 340px
})
export const searchIcon = style({
  position: 'absolute',
  insetInlineStart: '0.625rem', // 10px
  insetBlockStart: '50%',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  color: vars.color.institutional.ink5,
  pointerEvents: 'none',
})
export const searchInput = style({
  flex: 1,
  minInlineSize: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: vars.font.family.heading, // Figma: Inter no corpo do grid
  fontSize: vars.font.size.xs, // ~12.5px
  color: vars.color.institutional.ink2,
  '::placeholder': { color: vars.color.institutional.ink5 },
})
export const kbd = style({
  marginInlineStart: vars.space.xs,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.institutional.ink5,
  background: vars.color.institutional.paperWarm,
  paddingInline: vars.space.xs,
  borderRadius: vars.radius.sm,
})

// Status-chips = segmented control (trilho paper-warm; segmento ativo branco "elevado").
export const statusChips = style({
  display: 'flex',
  gap: vars.space.xs, // 4px
  padding: '0.125rem', // 2px
  background: vars.color.institutional.paperWarm,
  borderRadius: vars.radius.md,
})
export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem', // 6px
  border: 'none',
  background: 'transparent',
  paddingBlock: '0.3125rem', // 5px
  paddingInline: '0.625rem', // 10px
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs, // ~11px
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink4,
  whiteSpace: 'nowrap',
})
export const chipActive = style([
  chip,
  {
    background: vars.color.surface.default,
    color: vars.color.institutional.ink2,
    boxShadow: vars.shadow.card,
  },
])
export const chipCount = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'], // 9.5px
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink5,
  background: vars.color.institutional.paperWarm,
  paddingBlock: '0.0625rem', // 1px
  paddingInline: '0.3125rem', // 5px
  borderRadius: vars.radius.sm,
})
// Quando o chip ativo (fundo branco) carrega o contador, o badge ganha o tom paper-beige p/ contraste.
export const chipCountOnActive = style([chipCount, { background: vars.color.institutional.paperBeige }])

// ── Grid (Figma 205-638): 6 colunas do DTO fino ───────────────────────────────
// Larguras EXATAS do Figma (px→rem): Tipo 65 · Doc 100 · Fornecedor flex(446) · Venc 105 · Líquido 110(→) · Status 130.
const GRID_COLS = '4.0625rem 6.25rem 1fr 6.5625rem 6.875rem 8.125rem'

export const gridWrap = style({ paddingInline: vars.space.lg, paddingBlock: vars.space.md })
export const grid = style({
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  background: vars.color.surface.default,
})
export const head = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  gap: '0.75rem', // 12px
  alignItems: 'center',
  minBlockSize: '2.25rem', // 36px
  paddingInline: vars.space.lg,
  background: vars.color.institutional.paperWarm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
// Cabeçalho denso (Figma "Badge" 9px Inter): caixa-alta, bold, tracking largo, ink-5.
export const headCell = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.institutional.ink5,
})
export const headCellRight = style([headCell, { textAlign: 'right' }])

export const row = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  gap: '0.75rem',
  alignItems: 'center',
  minBlockSize: '3.5rem', // 56px
  paddingInline: vars.space.lg,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  fontFamily: vars.font.family.heading, // Figma Body/Medium = Inter
  fontSize: vars.font.size.xs, // ~12.5px
  color: vars.color.institutional.ink2,
  transition: 'background 120ms ease',
  ':hover': { background: vars.color.institutional.paperWarm },
  ':last-child': { borderBlockEnd: 'none' },
})
export const cell = style({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })
export const cellMutedDoc = style([cell, { color: vars.color.institutional.ink4 }])
export const cellNet = style({ textAlign: 'right', fontFamily: vars.font.family.mono })

// Badge de status — Figma "Badge" 9px bold caixa-alta.
export const statusBadge = style({
  justifySelf: 'start',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.xl,
})
export const statusVariant = styleVariants({
  Rascunho: { background: vars.color.status.cancelledBg, color: vars.color.status.cancelledText },
  Aberto: { background: vars.color.status.pendingBg, color: vars.color.status.pendingText },
  Aprovado: { background: vars.color.status.activeBg, color: vars.color.status.activeText },
  Transmitido: { background: vars.color.status.finishedBg, color: vars.color.status.finishedText },
  Recusado: { background: vars.color.status.terminatedBg, color: vars.color.status.terminatedText },
  Pago: { background: vars.color.status.activeBg, color: vars.color.status.activeText },
  Conciliado: { background: vars.color.status.finishedBg, color: vars.color.status.finishedText },
})

export const placeholder = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingBlock: vars.space.xl,
  paddingInline: vars.space.lg,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  textAlign: 'center',
})
export const placeholderTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  color: vars.color.text.secondary,
})
export const errorBanner = style({
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontSize: vars.font.size.sm,
  textAlign: 'center',
})

// ── Bottombar (footer no padrão Contratos): paginação + Novo Documento ────────
export const bottombar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  height: '3.5rem',
  paddingInline: vars.space.lg,
  background: vars.color.institutional.paperWarm,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  position: 'fixed',
  insetBlockEnd: 0,
  insetInlineStart: 'var(--sidebar-width, 14rem)',
  insetInlineEnd: 0,
  zIndex: 100,
})
// Grupo à direita do footer: Exportar + Novo Documento.
export const footerActions = style({
  marginInlineStart: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.md,
})
export const newButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  textDecoration: 'none',
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  fontFamily: vars.font.family.body,
  color: vars.color.surface.default,
  background: vars.color.institutional.blue,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  ':hover': { background: vars.color.institutional.blueDeep },
})

export const pagination = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})
export const pageRange = style({})
export const pageNav = style({ display: 'flex', gap: vars.space.xs })
export const pageBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  cursor: 'pointer',
  ':disabled': { opacity: 0.4, cursor: 'not-allowed' },
})
export const separator = style({ color: vars.color.institutional.ink5 })
export const select = style({
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  borderRadius: vars.radius.sm,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontSize: vars.font.size.sm,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.xs,
  cursor: 'pointer',
})
export const perPageLabel = style({ color: vars.color.text.muted })

// ── Impressão (PDF via window.print): esconde o cromo, imprime só o grid ──
globalStyle(`${filterBar}, ${bottombar}`, { '@media': { print: { display: 'none !important' } } })
globalStyle(screen, { '@media': { print: { paddingBlockEnd: '0 !important' } } })
