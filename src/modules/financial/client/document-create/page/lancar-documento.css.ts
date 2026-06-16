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

// Layout 3-col do Figma 626-2: preview/OCR (480) · form (FILL) · sidebar (340). Colapsa por etapas:
// abaixo de 75rem some o preview (form+sidebar); abaixo de 60rem vira coluna única.
export const body = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(16rem, 28rem) minmax(0, 1fr) 21.25rem',
  gap: vars.space.lg,
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 75rem)': { gridTemplateColumns: 'minmax(0, 1fr) 21.25rem' },
    'screen and (max-width: 60rem)': { gridTemplateColumns: '1fr' },
  },
})

export const formCol = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  minInlineSize: 0,
})

// Seções FLAT do Figma (sem card): divisória inferior + respiro vertical; a última seção sem borda.
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  paddingBlock: '1.125rem', // 18px (Figma)
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  selectors: { '&:last-of-type': { borderBlockEnd: 'none' } },
})
export const sectionTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading, // Inter (Figma)
  fontSize: vars.font.size.sm, // ~13px
  fontWeight: vars.font.weight.bold,
  letterSpacing: '-0.005em',
  color: vars.color.institutional.ink2,
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
  fontSize: vars.font.size['2xs'], // 9.5px (Label/Field do Figma)
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})
// Célula combinada "Nº / Série": dois inputs sob um rótulo só (fidelidade Figma + modelo separado).
export const numberSeriesRow = style({
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr',
  gap: vars.space.xs,
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
  alignItems: 'baseline',
  gap: vars.space.sm,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})
export const compVal = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  color: vars.color.text.primary,
})
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

// ── Coluna esquerda: Preview / OCR (chrome — Figma 626:22 é um shell vazio) ──────
export const previewCol = style({
  position: 'sticky',
  insetBlockStart: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  minBlockSize: '24rem',
  paddingInlineEnd: vars.space.lg,
  borderInlineEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  '@media': { 'screen and (max-width: 75rem)': { display: 'none' } },
})
export const previewHeader = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })
export const previewBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: '0.125rem',
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.sm,
  background: vars.color.institutional.blueBg,
  color: vars.color.institutional.blueDeep,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
})
export const previewHeaderText = style({ fontSize: vars.font.size.xs, color: vars.color.text.muted })
export const dropzone = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.md,
  textAlign: 'center',
  padding: vars.space.xl,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} dashed ${vars.color.institutional.paperRule}`,
  background: vars.color.institutional.paperWarm,
})
export const dropzoneIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '3rem',
  blockSize: '3rem',
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  color: vars.color.institutional.blueDeep,
})
export const dropzoneHint = style({
  maxInlineSize: '18rem',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  lineHeight: 1.5,
  color: vars.color.text.secondary,
})
export const dropzoneFormats = style({ fontSize: vars.font.size['2xs'], color: vars.color.text.muted })

// ── Sidebar: painéis FLAT (Figma 670:* — sem card; só título + conteúdo) ─────────
export const panel = style({ display: 'flex', flexDirection: 'column', gap: vars.space.sm })
export const panelTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
})

// ── Títulos Previstos: árvore (pai → filhos com conector tracejado + ticks) ───────
export const titulosTree = style({ display: 'flex', flexDirection: 'column', gap: vars.space.sm })
export const paiRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
})
export const paiName = style({
  flex: 1,
  minInlineSize: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
export const paiVal = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.blueDeep,
  whiteSpace: 'nowrap',
})
export const childrenContainer = style({
  display: 'flex',
  flexDirection: 'column',
  marginInlineStart: '0.875rem', // 14px
  paddingInlineStart: '0.875rem',
  borderInlineStart: `0.09375rem dashed ${vars.color.institutional.paperRule}`, // 1.5px
})
export const childRow = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.sm,
  // Tick: linha horizontal curta saindo do conector tracejado até a linha (Figma).
  '::before': {
    content: '""',
    position: 'absolute',
    insetInlineStart: 'calc(-0.875rem - 0.09375rem)',
    insetBlockStart: '50%',
    inlineSize: '0.75rem', // 12px
    blockSize: '0.09375rem', // 1.5px
    background: vars.color.institutional.paperRule,
  },
})
export const childKind = style({
  display: 'inline-flex',
  justifyContent: 'flex-start',
  inlineSize: '2.375rem', // 38px (alinha os badges)
  flexShrink: 0,
})
export const childDest = style({
  flex: 1,
  minInlineSize: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
export const childVal = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink2,
  whiteSpace: 'nowrap',
})

// Badge de tipo (Figma "Type-badge"): teal do mock → AZUL do DS; divergente → âmbar.
const kindBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBlock: '0.0625rem',
  paddingInline: vars.space.xs,
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.06em',
  lineHeight: 1,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
} as const
export const kindBadge = styleVariants({
  blue: [
    kindBadgeBase,
    { background: vars.color.institutional.blueBg, color: vars.color.institutional.blueDeep },
  ],
  amber: [
    kindBadgeBase,
    { background: vars.color.institutional.orangeLight, color: vars.color.status.pendingText },
  ],
})
// Badge do Pai: mesmo tom azul, levemente maior (Figma usa padding/borda maiores).
export const paiBadge = style([
  kindBadge.blue,
  { paddingBlock: '0.1875rem', paddingInline: vars.space.sm, flexShrink: 0 },
])

export const titulosEmpty = style({ fontSize: vars.font.size.xs, color: vars.color.text.muted })

// ── Validação: checklist (Ok / Aviso / Pendente) — Figma 670:420 ─────────────────
export const validations = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs })
const validationItemBase = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.sm,
  paddingBlock: vars.space.sm,
  paddingInline: '0.625rem', // 10px
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  lineHeight: 1.45,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
} as const
export const validationItem = styleVariants({
  ok: [validationItemBase, { color: vars.color.institutional.ink2 }],
  aviso: [
    validationItemBase,
    {
      background: vars.color.institutional.orangeLight,
      borderColor: vars.color.institutional.orange,
      color: vars.color.status.pendingText,
    },
  ],
  pendente: [validationItemBase, { color: vars.color.institutional.ink4 }],
})
const validationDotBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '0.9375rem', // 15px
  blockSize: '0.9375rem',
  flexShrink: 0,
  borderRadius: '50%',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  lineHeight: 1,
} as const
export const validationDot = styleVariants({
  ok: [
    validationDotBase,
    {
      background: vars.color.institutional.green,
      color: vars.color.surface.default,
      '::after': { content: '"✓"' },
    },
  ],
  aviso: [
    validationDotBase,
    {
      background: vars.color.institutional.orange,
      color: vars.color.surface.default,
      '::after': { content: '"!"' },
    },
  ],
  pendente: [
    validationDotBase,
    {
      background: vars.color.institutional.paperBeige,
      color: vars.color.institutional.ink4,
      border: `${vars.borderWidth.thin} solid ${vars.color.institutional.ink5}`,
      '::after': { content: '"·"' },
    },
  ],
})
export const validationText = style({ flex: 1, minInlineSize: 0 })

// ── S3 Pagamento: entity-cards (Conta do fornecedor / Aprovador) — chrome ────────
export const entityCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  paddingBlock: '0.75rem', // 12px
  paddingInline: '0.875rem', // 14px
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.institutional.paperWarm,
  minInlineSize: 0,
})
export const entityIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem', // 32px
  blockSize: '2rem',
  flexShrink: 0,
  borderRadius: vars.radius.lg,
  background: vars.color.institutional.blueDeep, // teal do Figma → azul da marca
  color: vars.color.surface.default,
})
export const entityInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1875rem', // 3px
  flex: 1,
  minInlineSize: 0,
})
export const entityLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})
export const entityValue = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.muted, // estado chrome: hint discreto (sem dado real)
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
// ── S4 Categorização: cabeçalho com pill de contrato (chrome) ────────────────────
export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
})
export const sectionHeadTitle = style({ flex: 1, minInlineSize: 0 })
export const contratoPill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.md,
  borderRadius: '1.5rem', // pill (sem token de pill no DS)
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.institutional.paperWarm,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})
export const contratoLink = style({
  paddingInlineStart: vars.space.sm,
  borderInlineStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  color: vars.color.institutional.blueDeep,
  fontWeight: vars.font.weight.medium,
})

// ── Bottombar fixa (Figma 626:25): status + quick-action · spacer · ações ─────────
export const pageBottombar = style({
  position: 'sticky',
  insetBlockEnd: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '0.875rem', // 14px
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  '@media': { 'screen and (max-width: 48rem)': { flexWrap: 'wrap' } },
})
export const statusGroup = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })
export const statusDot = style({
  inlineSize: '0.375rem', // 6px
  blockSize: '0.375rem',
  borderRadius: '50%',
  background: vars.color.institutional.green,
})
export const statusText = style({ fontSize: vars.font.size.xs, color: vars.color.institutional.ink4 })
export const draftPill = style({
  paddingBlock: '0.1875rem', // 3px
  paddingInline: '0.625rem', // 10px
  borderRadius: vars.radius.xl,
  background: vars.color.institutional.paperBeige,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink3,
})
export const addSupplierButton = style({
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.sm,
  border: `${vars.borderWidth.thin} dashed ${vars.color.institutional.paperRule}`,
  background: 'transparent',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.muted,
  cursor: 'not-allowed',
})
export const bottombarSpacer = style({ flex: 1, minInlineSize: 0 })
export const actionsGroup = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })
const actionButtonBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingBlock: '0.625rem', // 10px
  paddingInline: '0.875rem', // 14px
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm, // 13px
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
} as const
export const discardButton = style([
  actionButtonBase,
  { border: 'none', background: 'transparent', color: vars.color.institutional.ink2 },
])
export const draftButton = style([
  actionButtonBase,
  {
    border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
    background: vars.color.surface.default,
    color: vars.color.text.muted,
    cursor: 'not-allowed',
  },
])
export const kbdChip = style({
  paddingBlock: '0.125rem', // 2px
  paddingInline: vars.space.xs,
  borderRadius: vars.radius.sm,
  background: vars.color.institutional.paperBeige,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.institutional.ink3,
})
