/**
 * Lançar Documento — estilos (vanilla-extract, só-tokens §X). Paleta DS v1 institucional (mesma do
 * Contratos reformado): `institutional.*` (marca blue, papel paperWarm/paperRule, ink2–5), `status.*`,
 * `font.family.mono` nos valores monetários. Layout do mock: form (esquerda) + sidebar Composição/Títulos
 * (direita). Painel PDF/OCR é gated (fora do v1).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  inlineSize: '100%',
})

// Topbar própria do Lançar (Figma): ← · título · breadcrumb · ✕, barra de 44px.
export const topbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.875rem', // 14px
  minBlockSize: '2.75rem', // 44px
  paddingBlock: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
export const topbarBack = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.75rem',
  blockSize: '1.75rem',
  borderRadius: vars.radius.md,
  color: vars.color.institutional.blueDeep,
  fontSize: vars.font.size.lg,
  textDecoration: 'none',
  ':hover': { background: vars.color.institutional.blueBg },
})
export const topbarClose = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.75rem',
  blockSize: '1.75rem',
  borderRadius: vars.radius.md,
  color: vars.color.institutional.ink4,
  fontSize: vars.font.size.md,
  textDecoration: 'none',
  ':hover': { background: vars.color.institutional.paperWarm },
})
export const topTitle = style({
  margin: 0,
  fontFamily: vars.font.family.body, // Nunito (título, padrão Contratos)
  fontSize: vars.font.size.sm, // 14px (Figma)
  fontWeight: vars.font.weight.bold,
  letterSpacing: '-0.005em',
  color: vars.color.institutional.ink2,
})
export const crumb = style({
  marginInlineStart: 'auto',
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

// Hero do fornecedor (Figma): overline mono · nome grande · botão Alterar.
export const hero = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'end',
  gap: vars.space.lg,
  paddingBlockEnd: vars.space.md,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
export const heroInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: 0,
})
export const heroOverline = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})
export const heroName = style({
  fontFamily: vars.font.family.body, // Fraunces no mock → Nunito no DS (sem serif)
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '-0.012em',
  color: vars.color.institutional.ink2,
})
export const heroAlter = style({
  alignSelf: 'center',
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  whiteSpace: 'nowrap',
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.blueDeep,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.md,
})

export const body = style({
  display: 'grid',
  gridTemplateColumns: '1fr 21rem',
  gap: vars.space.lg,
  alignItems: 'start',
  '@media': { 'screen and (max-width: 60rem)': { gridTemplateColumns: '1fr' } },
})

export const formCol = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  minInlineSize: 0,
})

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  paddingBlockEnd: vars.space.lg,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.card,
})
export const sectionTitle = style({
  margin: 0,
  marginInline: `calc(-1 * ${vars.space.lg})`,
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.institutional.paperWarm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderStartStartRadius: vars.radius.lg,
  borderStartEndRadius: vars.radius.lg,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  color: vars.color.text.primary,
})

export const fieldGrid = styleVariants({
  six: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: vars.space.md },
  three: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: vars.space.md },
  two: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: vars.space.md },
  wide: { display: 'grid', gridTemplateColumns: '1fr', gap: vars.space.md },
})

export const field = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs, minInlineSize: 0 })
export const fieldLabel = style({
  fontFamily: vars.font.family.heading, // Inter (Figma/mock)
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})

// Input do mock: Inter 12.5px, min-height 34px, border 1px paper-rule, radius 6px, padding 8/11px.
const controlBase = {
  inlineSize: '100%',
  minBlockSize: '2.125rem', // 34px
  paddingBlock: '0.5rem', // 8px
  paddingInline: '0.6875rem', // 11px
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink2,
  fontFamily: vars.font.family.heading, // Inter (Figma/mock)
  fontSize: vars.font.size.xs, // ~12.5px
  ':focus': { outline: 'none', borderColor: vars.color.institutional.blueLine },
} as const

export const control = style(controlBase)
export const controlMono = style([controlBase, { fontFamily: vars.font.family.mono, textAlign: 'end' }])
export const controlDisabled = style([
  controlBase,
  { background: vars.color.institutional.paperBeige, color: vars.color.text.muted, cursor: 'not-allowed' },
])

export const retentionsHint = style({ fontSize: vars.font.size.xs, color: vars.color.text.muted })

// ── Sidebar ──────────────────────────────────────────────────────────────────
export const sidebarCol = style({
  position: 'sticky',
  insetBlockStart: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
})
export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.card,
})
export const cardTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})
export const compRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})
export const compVal = style({ fontFamily: vars.font.family.mono, color: vars.color.text.primary })
export const compSep = style({
  blockSize: vars.borderWidth.thin,
  background: vars.color.institutional.paperRule,
})

export const netBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.institutional.blueBg,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.blueLine}`,
})
export const netLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.blueDeep,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})
export const netValue = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xl,
  color: vars.color.institutional.blueDeep,
})
export const netDue = style({ fontSize: vars.font.size.xs, color: vars.color.text.muted })

export const titulo = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: vars.font.size.sm,
})
export const tituloParent = style([
  titulo,
  { fontWeight: vars.font.weight.semibold, color: vars.color.text.primary },
])
export const tituloChild = style([
  titulo,
  { paddingInlineStart: vars.space.md, color: vars.color.text.secondary },
])
export const tituloVal = style({ marginInlineStart: 'auto', fontFamily: vars.font.family.mono })

// ── Estado / ações ─────────────────────────────────────────────────────────────
export const errorBanner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontSize: vars.font.size.sm,
})
export const bottombar = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space.md,
  paddingBlockStart: vars.space.md,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
export const ghostButton = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.muted,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  cursor: 'pointer',
})

export const successCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.xl,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.blueLine}`,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.card,
})
export const successTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  color: vars.color.institutional.greenDeep,
})
