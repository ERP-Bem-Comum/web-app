/**
 * Estilos do modal "Centros de Custo - {Programa}" (§1.5) no padrão visual "brand" — overlay + cartão grande,
 * dropdown de centro + "Adicionar centro", árvore de 3 níveis com ações por linha e painel de formulário
 * lateral. Cores/borda/sombra/inputs vêm de `brand`; `vars.*` só p/ overlay/elevated-shadow/font. Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

const CHEVRON_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7480' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: brand.space.lg,
  background: vars.color.institutional.overlay,
})

export const modal = style({
  display: 'flex',
  flexDirection: 'column',
  inlineSize: '100%',
  maxInlineSize: '56rem',
  maxBlockSize: '90vh',
  borderRadius: brand.radius.lg,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  boxShadow: vars.shadow.cardElevated,
  overflow: 'hidden',
  fontFamily: vars.font.family.heading, // Inter
})

export const head = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: brand.space.md,
  padding: brand.space.xl,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

export const headTexts = style({ display: 'flex', flexDirection: 'column', gap: brand.space.xxs })

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.panelTitle,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const subtitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.subtitle,
  color: brand.color.ink400,
})

export const close = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  border: 'none',
  background: 'transparent',
  color: brand.color.ink500,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  borderRadius: brand.radius.sm,
  selectors: { '&:hover': { background: brand.color.surfaceAlt, color: brand.color.ink900 } },
})

export const toolbar = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: brand.space.md,
  padding: brand.space.xl,
  paddingBlockEnd: 0,
})

export const field = style({ display: 'flex', flexDirection: 'column', gap: brand.space.xs, flex: 1 })

export const label = style({
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
})

export const input = style({
  blockSize: brand.size.field,
  paddingInline: brand.space.md,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
  color: brand.color.ink900,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  selectors: {
    '&:hover': { borderColor: brand.color.lineStrong },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// Select brand — mesmo campo + chevron (appearance:none).
export const select = style([
  input,
  {
    paddingInlineEnd: brand.space.xxl,
    background: `${brand.color.surface} ${CHEVRON_SVG} no-repeat`,
    backgroundPosition: `right ${brand.space.md} center`,
    appearance: 'none',
    cursor: 'pointer',
  },
])

export const body = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: brand.space.lg,
  padding: brand.space.xl,
  overflowY: 'auto',
  minBlockSize: 0,
})

export const bodyWithForm = style({ gridTemplateColumns: '1.4fr 1fr' })

export const tree = style({ display: 'flex', flexDirection: 'column', gap: brand.space.sm, minBlockSize: 0 })

// ── Linhas da árvore (indentação por profundidade) ──
export const rowCentro = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.sm,
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.md,
  borderRadius: brand.radius.md,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.cadBg,
})

export const rowCategoria = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.sm,
  marginInlineStart: brand.space.lg,
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.md,
  borderRadius: brand.radius.md,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surfaceAlt,
})

// Lista de subcategorias — pequeno respiro branco (gap) entre as linhas ao expandir.
export const subList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xs,
  marginInlineStart: `calc(${brand.space.lg} * 2)`,
  marginBlockStart: brand.space.xs,
})

export const rowSub = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: brand.space.sm,
  paddingBlock: brand.space.xs,
  paddingInline: brand.space.md,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  background: brand.color.surface,
})

export const rowName = style({
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  color: brand.color.ink900,
})

export const rowNameCentro = style([rowName, { fontWeight: brand.weight.semibold }])

export const rowNameOff = style({ textDecoration: 'line-through', color: brand.color.ink400 })

export const rowActions = style({ display: 'flex', alignItems: 'center', gap: brand.space.sm })

// Início da linha: chevron de expandir/recolher + nome.
export const rowStart = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  minInlineSize: 0,
})

export const chevronButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.5rem',
  blockSize: '1.5rem',
  flexShrink: 0,
  border: 'none',
  background: 'transparent',
  color: brand.color.ink500,
  cursor: 'pointer',
  borderRadius: brand.radius.xs,
  transition: `all ${brand.ease}`,
  selectors: { '&:hover': { background: brand.color.surface, color: brand.color.ink900 } },
})

// Espaçador no lugar do chevron (subcategoria = folha, sem expandir) — mantém o alinhamento.
export const chevronSpacer = style({ inlineSize: '1.5rem', flexShrink: 0 })

// Botão "Editar" com ícone de lápis.
export const editButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.xs,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: brand.radius.xs,
  paddingBlock: brand.space.xs,
  paddingInline: brand.space.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink500,
  selectors: { '&:hover': { background: brand.color.surface, color: brand.color.ink900 } },
})

const actionBase = style({
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: brand.radius.xs,
  paddingBlock: brand.space.xs,
  paddingInline: brand.space.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.label,
  color: brand.color.primary,
  fontWeight: brand.weight.semibold,
  selectors: { '&:hover': { background: brand.color.surface } },
})

export const actionLink = style([actionBase])
export const actionMuted = style([actionBase, { color: brand.color.ink500 }])

export const addCentroButton = style({
  alignSelf: 'flex-end',
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.lg,
  borderRadius: brand.radius.sm,
  border: `${vars.borderWidth.thin} solid ${brand.color.primary}`,
  background: brand.color.surface,
  color: brand.color.primary,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: `all ${brand.ease}`,
  selectors: { '&:hover': { background: brand.color.cadBg } },
})

// ── Painel de formulário lateral ──
export const formPanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.md,
  padding: brand.space.md,
  borderRadius: brand.radius.md,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surfaceAlt,
  blockSize: 'fit-content',
})

export const formTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.sectionH2,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const formError = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.hint,
  color: vars.color.feedback.errorText,
})

export const formActions = style({ display: 'flex', gap: brand.space.sm, marginBlockStart: brand.space.xs })

const buttonBase = style({
  flex: 1,
  paddingBlock: brand.space.sm,
  borderRadius: brand.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const cancelButton = style([
  buttonBase,
  {
    border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    background: brand.color.surface,
    color: brand.color.ink700,
    selectors: { '&:hover': { background: brand.color.surfaceAlt, borderColor: brand.color.ink400 } },
  },
])

export const submitButton = style([
  buttonBase,
  {
    border: 'none',
    background: brand.color.primary,
    color: brand.color.surface,
    boxShadow: brand.shadow.btn,
    selectors: { '&:hover': { background: brand.color.primaryHover } },
  },
])

// ── Chave (switch) de ativar/desativar ──
export const switchLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.xs,
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
  borderRadius: brand.radius.pill,
  background: brand.color.lineStrong,
  transition: `background ${brand.ease}`,
  '::after': {
    content: '""',
    position: 'absolute',
    insetBlockStart: '0.15rem',
    insetInlineStart: '0.15rem',
    inlineSize: '0.8rem',
    blockSize: '0.8rem',
    borderRadius: '50%',
    background: brand.color.surface,
    transition: `transform ${brand.ease}`,
  },
  selectors: {
    [`${switchInput}:checked + &`]: { background: brand.color.primary },
    [`${switchInput}:checked + &::after`]: { transform: 'translateX(0.9rem)' },
    [`${switchInput}:focus-visible + &`]: {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const switchText = style({
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink500,
})
