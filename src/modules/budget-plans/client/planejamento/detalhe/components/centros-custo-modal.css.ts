/**
 * Estilos do modal "Centros de Custo - {Programa}" (§1.5) — overlay + cartão grande, dropdown de centro +
 * "Adicionar centro", árvore de 3 níveis com ações por linha e painel de formulário lateral. Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.lg,
  background: vars.color.institutional.overlay,
})

export const modal = style({
  display: 'flex',
  flexDirection: 'column',
  inlineSize: '100%',
  maxInlineSize: '56rem',
  maxBlockSize: '90vh',
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.cardElevated,
  overflow: 'hidden',
})

export const head = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: vars.space.md,
  padding: vars.space.lg,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const headTexts = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs })

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const subtitle = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const close = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  borderRadius: vars.radius.sm,
  selectors: { '&:hover': { background: vars.color.surface.subtle, color: vars.color.text.primary } },
})

export const toolbar = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: vars.space.md,
  padding: vars.space.lg,
  paddingBlockEnd: 0,
})

export const field = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs, flex: 1 })

export const label = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
})

export const input = style({
  blockSize: '2.5rem',
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const select = style([input])

export const body = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: vars.space.lg,
  padding: vars.space.lg,
  overflowY: 'auto',
  minBlockSize: 0,
})

export const bodyWithForm = style({ gridTemplateColumns: '1.4fr 1fr' })

export const tree = style({ display: 'flex', flexDirection: 'column', gap: vars.space.sm, minBlockSize: 0 })

// ── Linhas da árvore (indentação por profundidade) ──
export const rowCentro = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 12%, white)`,
})

export const rowCategoria = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  marginInlineStart: vars.space.lg,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 6%, white)`,
})

// Lista de subcategorias — pequeno respiro branco (gap) entre as linhas ao expandir.
export const subList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  marginInlineStart: `calc(${vars.space.lg} * 2)`,
  marginBlockStart: vars.space.xs,
})

export const rowSub = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.sm,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.subtle,
})

export const rowName = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

export const rowNameCentro = style([rowName, { fontWeight: vars.font.weight.semibold }])

export const rowNameOff = style({ textDecoration: 'line-through', color: vars.color.text.secondary })

export const rowActions = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })

// Início da linha: chevron de expandir/recolher + nome.
export const rowStart = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm, minInlineSize: 0 })

export const chevronButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.5rem',
  blockSize: '1.5rem',
  flexShrink: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  cursor: 'pointer',
  borderRadius: vars.radius.sm,
  selectors: { '&:hover': { color: vars.color.text.primary } },
})

// Espaçador no lugar do chevron (subcategoria = folha, sem expandir) — mantém o alinhamento.
export const chevronSpacer = style({ inlineSize: '1.5rem', flexShrink: 0 })

// Botão "Editar" com ícone de lápis.
export const editButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: vars.radius.sm,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
  selectors: { '&:hover': { background: vars.color.surface.subtle, color: vars.color.text.primary } },
})

const actionBase = style({
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: vars.radius.sm,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.brand.normal,
  fontWeight: vars.font.weight.semibold,
  selectors: { '&:hover': { background: `color-mix(in srgb, ${vars.color.brand.normal} 12%, white)` } },
})

export const actionLink = style([actionBase])
export const actionMuted = style([actionBase, { color: vars.color.text.secondary }])

export const addCentroButton = style({
  alignSelf: 'flex-end',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.brand.normal}`,
  background: 'transparent',
  color: vars.color.brand.normal,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: { '&:hover': { background: `color-mix(in srgb, ${vars.color.brand.normal} 10%, white)` } },
})

// ── Painel de formulário lateral ──
export const formPanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.subtle,
  blockSize: 'fit-content',
})

export const formTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

export const formActions = style({ display: 'flex', gap: vars.space.sm, marginBlockStart: vars.space.xs })

const buttonBase = style({
  flex: 1,
  paddingBlock: vars.space.sm,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
})

export const cancelButton = style([
  buttonBase,
  {
    border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
    background: vars.color.surface.default,
    color: vars.color.text.secondary,
  },
])

export const submitButton = style([
  buttonBase,
  {
    border: 'none',
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    selectors: { '&:hover': { background: vars.color.brand.hover } },
  },
])

// ── Chave (switch) de ativar/desativar ──
export const switchLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  cursor: 'pointer',
})

export const switchInput = style({
  position: 'absolute',
  inlineSize: 0,
  blockSize: 0,
  opacity: 0,
  overflow: 'hidden',
})

export const switchTrack = style({
  position: 'relative',
  display: 'inline-block',
  inlineSize: '2rem',
  blockSize: '1.1rem',
  flexShrink: 0,
  borderRadius: vars.radius.lg,
  background: vars.color.border.default,
  transition: 'background 120ms ease',
  '::after': {
    content: '""',
    position: 'absolute',
    insetBlockStart: '0.15rem',
    insetInlineStart: '0.15rem',
    inlineSize: '0.8rem',
    blockSize: '0.8rem',
    borderRadius: '50%',
    background: vars.color.surface.default,
    transition: 'transform 120ms ease',
  },
  selectors: {
    [`${switchInput}:checked + &`]: { background: vars.color.brand.normal },
    [`${switchInput}:checked + &::after`]: { transform: 'translateX(0.9rem)' },
    [`${switchInput}:focus-visible + &`]: {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const switchText = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
})
