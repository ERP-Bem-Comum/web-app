/**
 * Lançar Documento — estilos (vanilla-extract, só-tokens §X). Paleta DS v1 institucional (mesma do
 * Contratos reformado): `institutional.*` (marca blue, papel paperWarm/paperRule, ink2–5), `status.*`,
 * `font.family.mono` nos valores monetários. Layout do mock: form (esquerda) + sidebar Composição/Títulos
 * (direita). Painel PDF/OCR é gated (fora do v1).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Preenche a caixa de conteúdo do shell (que é overflow:hidden) e gerencia o próprio scroll:
// topbar fixa · body (3 colunas que rolam) · bottombar fixa. Sem isso, a tela longa fica cortada.
// Editor full-bleed: ocupa toda a região abaixo do topbar do sistema e à direita do menu (como o mock).
// Sendo a própria tela fixa, o header e o footer viram linhas flex normais (full-width automático).
export const screen = style({
  position: 'fixed',
  insetBlockStart: vars.size.topbar, // logo abaixo do topbar do sistema
  insetBlockEnd: 0,
  insetInlineStart: 'var(--sidebar-width, 16.25rem)', // à direita do menu (acompanha colapso)
  insetInlineEnd: 0,
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: 0,
  overflow: 'hidden',
  background: vars.color.surface.default,
})

// Topbar própria do Lançar (Figma): ← · título · breadcrumb · ✕, barra de 44px.
export const topbar = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '0.875rem', // 14px
  minBlockSize: '2.75rem', // 44px
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.lg,
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
  fontFamily: vars.font.family.body, // marca — o glyph ← herdava a serifa do body
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
  fontFamily: vars.font.family.body, // marca — o glyph ✕ herdava a serifa do body
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
  fontFamily: vars.font.family.body, // Nunito (brand)
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
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
export const heroCnpj = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink5,
})
// Linha overline + badge de tipo (mesmo padrão do "Contratado selecionado" de contratos).
export const heroBadgeRow = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })
// Badge de TIPO de parceiro — cores por `color.partnerType.*` (idênticas às de contratos).
const partnerBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBlock: '0.1875rem',
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
} as const
export const partnerBadge = styleVariants({
  supplier: [
    partnerBadgeBase,
    { color: vars.color.partnerType.supplier.text, background: vars.color.partnerType.supplier.background },
  ],
  financier: [
    partnerBadgeBase,
    { color: vars.color.partnerType.financier.text, background: vars.color.partnerType.financier.background },
  ],
  act: [
    partnerBadgeBase,
    { color: vars.color.partnerType.act.text, background: vars.color.partnerType.act.background },
  ],
  collaborator: [
    partnerBadgeBase,
    {
      color: vars.color.partnerType.collaborator.text,
      background: vars.color.partnerType.collaborator.background,
    },
  ],
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
  cursor: 'pointer',
  transition: 'background 120ms, border-color 120ms',
  ':hover': {
    background: vars.color.institutional.blueBg,
    borderColor: vars.color.institutional.blueLine,
  },
})

// ── Picker de parceiro (dropdown buscável no hero, padrão contratos) ──────────────
export const pickerWrap = style({ position: 'relative', alignSelf: 'center' })
// Captura clique-fora p/ fechar o dropdown (atrás do painel).
export const pickerBackdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 199,
  border: 'none',
  background: 'transparent',
  cursor: 'default',
})
export const pickerDropdown = style({
  position: 'absolute',
  insetInlineEnd: 0,
  insetBlockStart: 'calc(100% + 0.375rem)',
  inlineSize: '22rem',
  maxBlockSize: '20rem',
  overflowY: 'auto',
  zIndex: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  padding: vars.space.xs,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.card,
})
export const pickerSearch = style({
  inlineSize: '100%',
  minBlockSize: '2.125rem',
  marginBlockEnd: vars.space.xs,
  paddingBlock: '0.5rem',
  paddingInline: '0.6875rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink2,
  fontFamily: vars.font.family.body, // Nunito (brand)
  fontSize: vars.font.size.xs,
  ':focus': {
    outline: 'none',
    borderColor: vars.color.institutional.blue,
    boxShadow: `0 0 0 0.1875rem ${vars.color.institutional.blueBg}`,
  },
})
export const pickerItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  textAlign: 'start',
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.blueBg },
})
export const pickerItemSelected = style({ background: vars.color.institutional.blueBg })
export const pickerEmpty = style({
  padding: vars.space.sm,
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

// Layout 3-col do Figma 626-2: preview/OCR (480) · form (FILL) · sidebar (340). Colapsa por etapas:
// abaixo de 75rem some o preview (form+sidebar); abaixo de 60rem vira coluna única.
export const body = style({
  flex: 1,
  minBlockSize: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(16rem, 28rem) minmax(0, 1fr) 21.25rem',
  // A linha precisa ter a altura do container (senão vira auto = altura do conteúdo e nada rola).
  gridTemplateRows: 'minmax(0, 1fr)',
  overflow: 'hidden', // cada coluna rola sozinha (independent scroll, igual ao mock)
  '@media': {
    'screen and (max-width: 75rem)': { gridTemplateColumns: 'minmax(0, 1fr) 21.25rem' },
    'screen and (max-width: 60rem)': { gridTemplateColumns: '1fr' },
  },
})

export const formCol = style({
  display: 'flex',
  flexDirection: 'column',
  minInlineSize: 0,
  minBlockSize: 0,
  blockSize: '100%',
  overflowY: 'auto',
  paddingBlock: '1.375rem 2rem', // 22 / 32 (mock)
  paddingInline: '1.75rem', // 28
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
  fontFamily: vars.font.family.body, // Nunito (brand — padrão Contratos fieldLabel; Figma usava Inter)
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
  fontFamily: vars.font.family.body, // Nunito (brand — padrão Contratos input; Figma usava Inter)
  fontSize: vars.font.size.xs, // ~12.5px
  fontVariantNumeric: 'tabular-nums',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
  ':hover': { borderColor: vars.color.institutional.ink5 },
  ':focus': {
    outline: 'none',
    borderColor: vars.color.institutional.blue,
    boxShadow: `0 0 0 0.1875rem ${vars.color.institutional.blueBg}`, // anel 3px (marca)
  },
} as const

// Rolagem fina (igual ao mock) — aplicada às 3 colunas roláveis.
export const scrollArea = style({
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.institutional.paperRule} transparent`,
  '::-webkit-scrollbar': { width: '0.375rem', height: '0.375rem' },
  '::-webkit-scrollbar-thumb': {
    background: vars.color.institutional.paperRule,
    borderRadius: vars.radius.sm,
  },
})

export const control = style(controlBase)
export const controlMono = style([controlBase, { fontFamily: vars.font.family.mono, textAlign: 'end' }])
export const controlDisabled = style([
  controlBase,
  { background: vars.color.institutional.paperBeige, color: vars.color.text.muted, cursor: 'not-allowed' },
])

// Select com aparência custom (Figma/mock): some o caret nativo; o wrapper desenha o ▾ azul.
export const selectWrap = style({
  position: 'relative',
  inlineSize: '100%',
  '::after': {
    content: '"▾"',
    position: 'absolute',
    insetInlineEnd: '0.6875rem', // 11px
    insetBlockStart: '50%',
    transform: 'translateY(-50%)',
    color: vars.color.institutional.blueDeep,
    fontSize: vars.font.size.xs,
    pointerEvents: 'none',
  },
})
const selectAppearance = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  paddingInlineEnd: '1.75rem', // espaço p/ o caret
  cursor: 'pointer',
} as const
export const selectControl = style([controlBase, selectAppearance])
export const selectControlDisabled = style([
  controlBase,
  selectAppearance,
  { background: vars.color.institutional.paperBeige, color: vars.color.text.muted, cursor: 'not-allowed' },
])

export const retentionsHint = style({
  fontFamily: vars.font.family.body, // Nunito (brand) — hints/placeholders sob os campos
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})
// Cabeçalho do subgrupo Reforma Tributária (CBS/IBS) — rótulo + hint da regra (só registro de valor).
export const reformaHead = style({
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  columnGap: vars.space.sm,
  rowGap: vars.space.xs,
  marginBlockStart: vars.space.md,
  marginBlockEnd: vars.space.xs,
})
export const reformaTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
})

// ── Sidebar ──────────────────────────────────────────────────────────────────
// Coluna direita: rola sozinha; borda à esquerda separa do form (mock: padding 20/18, border-left).
export const sidebarCol = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg, // 24px (Figma: gap entre panels)
  minBlockSize: 0,
  blockSize: '100%',
  overflowY: 'auto',
  paddingBlock: '1.25rem', // 20 (mock)
  paddingInline: '1.125rem', // 18
  borderInlineStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
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
  fontFamily: vars.font.family.body, // Nunito (brand — rótulo é prose)
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink4,
})
// Linha "Valor Bruto": rótulo E valor em negrito (destaque do bruto na composição).
export const compRowStrong = style([
  compRow,
  { color: vars.color.institutional.ink2, fontWeight: vars.font.weight.bold },
])
export const compVal = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink2,
})
// Valor do "Valor Bruto" — negrito (mock: o bruto se destaca; retenções ficam normais).
export const compValStrong = style([compVal, { fontWeight: vars.font.weight.bold }])
// Campo editável na Composição (Descontos / Juros · Multa) — mono, alinhado à direita, compacto.
export const compInput = style({
  inlineSize: '7rem',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.xs,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.sm,
  background: vars.color.surface.default,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink2,
  textAlign: 'end',
  ':focus': {
    outline: 'none',
    borderColor: vars.color.institutional.blueLine,
    boxShadow: `0 0 0 0.125rem ${vars.color.institutional.blueBg}`,
  },
})
export const compSep = style({
  blockSize: vars.borderWidth.thin,
  background: vars.color.institutional.paperRule,
})

export const netBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  paddingBlock: '0.875rem', // 14px (Figma net-block)
  paddingInline: vars.space.md, // 16px
  borderRadius: vars.radius.lg, // 8px (Figma radius-lg)
  background: vars.color.institutional.blueBg,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.blueLine}`,
})
export const netLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'], // 9px overline (Figma Label/Overline — não 12px)
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.blueDeep,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
})
export const netValue = style({
  fontFamily: vars.font.family.mono,
  fontSize: '1.375rem', // 22px (Figma Mono/Display)
  lineHeight: 1.1,
  color: vars.color.institutional.blueDeep,
})
export const netDue = style({
  fontFamily: vars.font.family.body, // Nunito (brand)
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

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
  flexShrink: 0,
  marginBlockStart: vars.space.md,
  marginInline: vars.space.lg,
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
  margin: vars.space.lg,
  minBlockSize: 0,
  overflowY: 'auto',
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
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  minBlockSize: 0,
  blockSize: '100%',
  overflowY: 'auto',
  padding: '1.25rem', // 20 (mock)
  background: vars.color.institutional.blueBg, // parte de FORA azul claro (a coluna do OCR)
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
export const previewHeaderText = style({
  fontFamily: vars.font.family.body, // Nunito (brand)
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})
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
  // Caixa interna do OCR em bege (a coluna ao redor é azul) — contraste invertido.
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
  fontFamily: vars.font.family.body, // Nunito (brand — hint/prose, padrão Contratos)
  fontSize: vars.font.size.xs,
  lineHeight: 1.5,
  color: vars.color.text.secondary,
})
export const dropzoneFormats = style({
  fontFamily: vars.font.family.body, // Nunito (brand)
  fontSize: vars.font.size['2xs'],
  color: vars.color.text.muted,
})
// Input de arquivo escondido (o <label> ghostButton dispara o seletor).
export const fileInputHidden = style({
  position: 'absolute',
  inlineSize: '0.0625rem',
  blockSize: '0.0625rem',
  padding: 0,
  margin: '-0.0625rem',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
})
// Nota de estado do OCR (lendo / indisponível / erro) — honesta, abaixo do botão.
export const dropzoneNote = style({
  marginBlockStart: vars.space.xs,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size['2xs'],
  color: vars.color.institutional.blueDeep,
  textAlign: 'center',
})

// ── Sidebar: painéis FLAT (Figma 670:* — sem card; só título + conteúdo) ─────────
export const panel = style({ display: 'flex', flexDirection: 'column', gap: '0.625rem' /* 10px */ })
export const panelTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: `calc(${vars.font.size['2xs']} + 0.0625rem)`, // +1px nos títulos das seções da sidebar
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
  letterSpacing: '0.1em', // tracking largo (Figma Label/Overline)
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
  fontFamily: vars.font.family.body, // Nunito (brand — destino é prose; padrão Contratos)
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

export const titulosEmpty = style({
  fontFamily: vars.font.family.body, // Nunito (brand) — placeholder "Preencha o valor…"
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

// ── Validação: checklist (Ok / Aviso / Pendente) — Figma 670:420 ─────────────────
export const validations = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs })
const validationItemBase = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.sm,
  paddingBlock: vars.space.sm,
  paddingInline: '0.625rem', // 10px
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.body, // Nunito (brand — prose da validação; padrão Contratos)
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
  transition: 'background 120ms, border-color 120ms',
  // Hover (mock): realce azul claro da marca — mesmo tom da seleção.
  ':hover': {
    background: vars.color.institutional.blueBg,
    borderColor: vars.color.institutional.blueLine,
  },
})
export const entityIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem', // 32px
  blockSize: '2rem',
  flexShrink: 0,
  borderRadius: vars.radius.lg,
  background: vars.color.institutional.blueBg, // azul claro da marca (igual às caixas de ícone dos modais)
  color: vars.color.institutional.blueDeep,
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
// Mesmo do entityValue mas com dado REAL (não-muted) — usado quando há banco do fornecedor.
export const entityValueStrong = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink2,
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
  paddingInline: '0.75rem', // 12px (Figma)
  borderRadius: '1.5rem', // pill (sem token de pill no DS)
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.institutional.paperWarm,
  fontFamily: vars.font.family.body, // Nunito (brand) — texto do pill (ex.: "Sem contrato vinculado")
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
  transition: 'background 120ms, border-color 120ms',
  // Hover (mock): realce azul claro da marca — mesmo tom do hover do aprovador.
  ':hover': {
    background: vars.color.institutional.blueBg,
    borderColor: vars.color.institutional.blueLine,
  },
})
// Rótulo "CONTRATO" — overline pequeno maiúsculo (Figma Label/Field 9.5px, tracking largo).
export const contratoLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
})
// "Alterar" — link de texto puro (sem caixa/borda/preenchimento), como no mock. O divisor "·" fica a
// cargo do espaçamento do pill; só um leve padding à esquerda p/ respiro.
export const contratoLink = style({
  paddingInlineStart: vars.space.sm,
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.blueDeep,
  fontFamily: vars.font.family.body,
  fontWeight: vars.font.weight.medium,
  cursor: 'pointer',
})
// Chip de contrato vinculado (preenchido a partir do contrato "Em Andamento" do fornecedor).
export const contratoNum = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink2,
})
export const contratoStatus = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingInlineStart: vars.space.sm,
  borderInlineStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  color: vars.color.institutional.greenDeep,
  fontWeight: vars.font.weight.semibold,
})
export const contratoDot = style({
  inlineSize: '0.3125rem',
  blockSize: '0.3125rem',
  borderRadius: '50%',
  background: vars.color.institutional.green,
})

// ── Dropdown "Alterar contrato" (Categorização) — lista os contratos "Em Andamento" do parceiro ──
export const contratoPickerWrap = style({ position: 'relative', display: 'inline-flex' })
export const contratoMenu = style({
  position: 'absolute',
  top: 'calc(100% + 0.375rem)',
  insetInlineEnd: 0,
  // Acima do `pickerBackdrop` (zIndex 199): senão o backdrop cobre o menu e o clique na opção só fecha o
  // dropdown sem selecionar o contrato (mesmo nível do menu do seletor de fornecedor).
  zIndex: 200,
  minInlineSize: '15rem',
  maxBlockSize: '16rem',
  overflowY: 'auto',
  padding: vars.space.xs,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.cardElevated,
})
export const contratoMenuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  inlineSize: '100%',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  textAlign: 'start',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink2,
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.blueBg },
})
export const contratoMenuItemActive = style({
  background: vars.color.institutional.blueBg,
  fontWeight: vars.font.weight.semibold,
})
export const contratoMenuLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink5,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
})
export const contratoMenuNum = style({
  fontFamily: vars.font.family.mono,
  color: vars.color.institutional.ink2,
})
export const contratoMenuEmpty = style({
  padding: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

// ── Bottombar fixa (Figma 626:25): status + quick-action · spacer · ações ─────────
// Footer: última linha (full-width via screen fixa). Padrão da tela de contrato: 3.5rem, borda fina, branco.
export const pageBottombar = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '0.875rem', // 14px
  blockSize: '3.5rem',
  paddingInline: vars.space.lg,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
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
// Atalho funcional no rodapé → módulo de Parceiros › Fornecedor (mesma rota do "novo contrato").
// Secundário em ghost com borda tracejada da marca; hover azul claro.
export const addSupplierButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  blockSize: '2.5rem',
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} dashed ${vars.color.institutional.blueLine}`,
  background: 'transparent',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blueDeep,
  cursor: 'pointer',
  transition: 'background 150ms, border-color 150ms',
  ':hover': {
    background: vars.color.institutional.blueBg,
    borderColor: vars.color.institutional.blueDeep,
  },
})
export const bottombarSpacer = style({ flex: 1, minInlineSize: 0 })
export const actionsGroup = style({ display: 'flex', alignItems: 'center', gap: vars.space.sm })
// Botões do footer espelham os da tela de criar contrato: altura 2.5rem, sm bold, radius md.
const actionButtonBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  blockSize: '2.5rem',
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  cursor: 'pointer',
  transition: 'background 150ms, border-color 150ms, box-shadow 150ms',
} as const
// Primário: azul da MARCA (mais claro/suave) → hover brand.hover. (Lançar usa o tom de marca; o token
// global segue navy até alinhar o app todo.)
export const primaryButton = style([
  actionButtonBase,
  {
    border: 'none',
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    ':hover': { background: vars.color.brand.hover },
    ':disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
])
// Secundário (= buttonSecondary do contrato): branco + borda; hover azul claro.
export const draftButton = style([
  actionButtonBase,
  {
    border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
    background: vars.color.surface.default,
    color: vars.color.institutional.ink4,
    ':hover': {
      background: vars.color.institutional.blueBg,
      borderColor: vars.color.institutional.blueLine,
    },
    ':disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
])
// Descartar (ghost): mesmo tamanho/peso, sem fundo.
export const discardButton = style([
  actionButtonBase,
  {
    border: 'none',
    background: 'transparent',
    color: vars.color.institutional.ink4,
    ':hover': { background: vars.color.institutional.blueBg },
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

// ── Modal "Tipo de Documento" (Figma) — <dialog> nativo (ESC/focus-trap), padrão Contratos ───────
export const typeDialog = style({
  border: 'none',
  padding: 0,
  background: 'transparent',
  maxInlineSize: '100%',
  maxBlockSize: '100%',
  selectors: {
    '&::backdrop': {
      background: vars.color.institutional.overlay,
      backdropFilter: 'blur(6px)',
    },
  },
})
export const typeContent = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  inlineSize: 'min(34rem, calc(100vw - 2.5rem))', // 544px — modal mais compacto (cards menores), fiel ao mock
  maxBlockSize: '88vh',
  overflow: 'hidden',
  background: vars.color.surface.default,
  borderRadius: vars.radius.xl,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  boxShadow: vars.shadow.cardElevated,
})
export const typeHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
export const typeTitle = style({
  margin: 0,
  fontFamily: vars.font.family.body, // Nunito (brand) — título mais sutil nos modais
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})
export const typeClose = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.875rem',
  blockSize: '1.875rem',
  border: 'none',
  borderRadius: vars.radius.md,
  background: 'transparent',
  color: vars.color.institutional.ink4,
  fontSize: vars.font.size.lg,
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.paperWarm },
})
export const typeBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  minBlockSize: 0,
  overflowY: 'auto',
  paddingBlock: vars.space.lg,
  paddingInline: vars.space.lg,
})
export const typeSubtitle = style({
  margin: 0,
  fontFamily: vars.font.family.body, // Nunito (prose/brand)
  fontSize: vars.font.size.xs,
  lineHeight: 1.5,
  color: vars.color.text.secondary,
})
export const typeGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: vars.space.sm, // cards mais próximos (mock) — reduz a altura do modal
  '@media': { 'screen and (max-width: 36rem)': { gridTemplateColumns: '1fr' } },
})
export const typeCard = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: vars.space.sm, // avatar↔texto mais junto (cards compactos do mock)
  alignItems: 'start',
  padding: vars.space.sm, // card menor (antes md)
  textAlign: 'start',
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  cursor: 'pointer',
  transition: 'border-color 120ms, background 120ms, box-shadow 120ms, transform 120ms',
  // Hover do mock: borda+fundo tint, leve elevação e sombra.
  ':hover': {
    borderColor: vars.color.institutional.blueLine,
    background: vars.color.institutional.blueBg,
    transform: 'translateY(-1px)',
    boxShadow: vars.shadow.card,
  },
  ':focus-visible': {
    outline: 'none',
    borderColor: vars.color.institutional.blue,
    boxShadow: `0 0 0 0.1875rem ${vars.color.institutional.blueBg}`,
  },
})
// Selecionado (mock): borda da marca + anel 3px.
export const typeCardSelected = style({
  borderColor: vars.color.brand.normal,
  background: vars.color.institutional.blueBg,
  boxShadow: `0 0 0 0.1875rem ${vars.color.institutional.blueBg}`,
})
const typeAvatarBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2.25rem',
  blockSize: '2.25rem',
  flexShrink: 0,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.02em',
} as const
// Caixa do ícone — azul claro da marca (uniforme nos cards), combinando com o modal. Antes a cor variava
// por classe fiscal; a pedido, todas usam o mesmo tom suave (blueBg) só nesta tela de Lançar Documento.
const typeAvatarBlue = {
  background: vars.color.institutional.blueBg,
  color: vars.color.institutional.blueDeep,
}
export const typeAvatar = styleVariants({
  fiscal: [typeAvatarBase, typeAvatarBlue],
  partial: [typeAvatarBase, typeAvatarBlue],
  'non-fiscal': [typeAvatarBase, typeAvatarBlue],
})
// Avatar dos cards do modal de Forma de Pagamento — azul da marca (ícone/glifo do método).
export const methodAvatar = style([
  typeAvatarBase,
  {
    background: vars.color.institutional.blueBg, // azul claro da marca (igual aos cards de tipo)
    color: vars.color.institutional.blueDeep,
    fontSize: vars.font.size.sm, // 14px (glifo, como o mock)
    fontWeight: vars.font.weight.regular,
  },
])
export const typeCardMain = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: 0,
})
export const typeCardHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexWrap: 'wrap',
})
export const typeName = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})
const typeClassBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: '0.0625rem',
  paddingInline: vars.space.xs,
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
} as const
export const typeClassBadge = styleVariants({
  fiscal: [
    typeClassBadgeBase,
    { background: vars.color.institutional.blueBg, color: vars.color.institutional.blueDeep },
  ],
  partial: [
    typeClassBadgeBase,
    { background: vars.color.institutional.orangeLight, color: vars.color.status.pendingText },
  ],
  'non-fiscal': [
    typeClassBadgeBase,
    { background: vars.color.institutional.paperBeige, color: vars.color.institutional.ink4 },
  ],
})
export const typeDesc = style({
  fontFamily: vars.font.family.body, // Nunito (prose/brand)
  fontSize: vars.font.size.xs,
  lineHeight: 1.45,
  color: vars.color.text.secondary,
})
// Gatilho do campo Tipo (abre o modal) — mesma caixa do input, com o valor + caret.
export const typeTrigger = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  inlineSize: '100%',
  minBlockSize: '2.125rem',
  paddingBlock: '0.5rem',
  paddingInline: '0.6875rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink2,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  textAlign: 'start',
  cursor: 'pointer',
  transition: 'border-color 120ms, box-shadow 120ms',
  ':hover': { borderColor: vars.color.institutional.ink5 },
  ':focus-visible': {
    outline: 'none',
    borderColor: vars.color.institutional.blue,
    boxShadow: `0 0 0 0.1875rem ${vars.color.institutional.blueBg}`,
  },
  // Caret ▾ via CSS (mesmo padrão do selectWrap; evita literal no JSX).
  '::after': { content: '"▾"', color: vars.color.institutional.blueDeep, flexShrink: 0 },
})
export const typeTriggerPlaceholder = style({ color: vars.color.text.muted })
