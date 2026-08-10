/**
 * Estilos da TABELA EM ÁRVORE de Planejamento no padrão visual "brand" (mock `planejamento-brand`):
 * card surface + borda + sombra + radius lg, thead uppercase sobre `surfaceAlt`, linhas com hover,
 * chip de calendário, badges de status (dot + label), conector de árvore nas sub-linhas e rodapé "Total geral".
 * Cores/px fora do kit vivem em `planejamento.values.ts`; o resto vem de `brand`/`vars`. Só tokens (§X).
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { planejamento } from '../planejamento.values.ts'

const sz = planejamento.size

// Card em volta da tabela (surface + borda + sombra + radius lg, overflow hidden).
export const container = style({
  inlineSize: '100%',
  overflowX: 'auto',
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  fontFamily: vars.font.family.heading, // Inter
  fontSize: brand.text.body,
  color: brand.color.ink700,
})

// thead: bg surfaceAlt, border-bottom line, 12px 600 uppercase letter-spacing .03em ink500.
export const th = style({
  textAlign: 'start',
  paddingBlock: sz.theadPadBlock,
  paddingInline: brand.size.rowPadInline,
  fontFamily: vars.font.family.heading,
  fontSize: sz.theadFont,
  fontWeight: brand.weight.semibold,
  letterSpacing: '.03em',
  textTransform: 'uppercase',
  color: brand.color.ink500,
  background: brand.color.surfaceAlt,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  whiteSpace: 'nowrap',
})

// Coluna Total: alinhada à direita com o ícone de ordenação.
export const thNum = style([th, { textAlign: 'end' }])
export const thActions = style([th, { inlineSize: '3rem' }])

// Linha-pai: padding ~16px 22px, border-bottom line2, hover rowHover.
export const row = style({
  cursor: 'pointer',
  transition: `background ${brand.ease}`,
  selectors: {
    '&:hover': { background: brand.color.rowHover },
  },
})

// Sub-linha (versão-filha): fundo levemente diferente.
export const childRow = style([
  row,
  {
    background: planejamento.childBg,
    selectors: {
      '&:hover': { background: brand.color.rowHover },
    },
  },
])

export const td = style({
  paddingBlock: sz.rowPadBlock,
  paddingInline: brand.size.rowPadInline,
  verticalAlign: 'middle',
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
})

export const tdNum = style([td, { textAlign: 'end' }])
export const tdActions = style([td, { textAlign: 'end' }])

// Célula do nome: chevron + chip de calendário + nome/subtítulo.
export const nameCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  minInlineSize: 0,
  position: 'relative',
})

// Recuo da sub-linha (abre espaço para o conector de árvore).
export const nameCellChild = style([nameCell, { paddingInlineStart: sz.childIndent }])

export const indent = style({
  display: 'inline-block',
  inlineSize: sz.indent,
  flexShrink: 0,
})

// Chevron (22px, transparente, ink400, hover bg iconHover) que gira ao expandir.
export const chevronButton = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: sz.chevron,
  blockSize: sz.chevron,
  flexShrink: 0,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: brand.color.ink400,
  cursor: 'pointer',
  borderRadius: sz.chevronRadius,
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { background: planejamento.iconHover, color: brand.color.ink700 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// Ícone do chevron (ChevronDown): fechado aponta p/ direita (−90°); aberto aponta p/ baixo (0°).
export const chevronIcon = style({ display: 'inline-flex', transition: 'transform .18s ease' })
export const chevronIconClosed = style({ transform: 'rotate(-90deg)' })

// Chip de calendário (34px, bg cadBg, cor primary, radius iconSm).
export const planIcon = style({
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  inlineSize: sz.planIcon,
  blockSize: sz.planIcon,
  borderRadius: brand.radius.iconSm,
  background: brand.color.cadBg,
  color: brand.color.primary,
})

// Chip de calendário menor nas sub-linhas.
export const planIconChild = style([planIcon, { inlineSize: sz.planIconChild, blockSize: sz.planIconChild }])

export const nameText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sz.nameGap,
  minInlineSize: 0,
})

// Nome do plano: 14.5px 600 ink900.
export const planName = style({
  fontFamily: vars.font.family.heading,
  fontSize: sz.planNameFont,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const planNameLink = style([
  planName,
  {
    background: 'transparent',
    border: 'none',
    padding: 0,
    textAlign: 'start',
    cursor: 'pointer',
    selectors: {
      '&:hover': { textDecoration: 'underline' },
      '&:focus-visible': {
        outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
        outlineOffset: vars.focusRing.offset,
      },
    },
  },
])

// Sub-linha: nome levemente mais claro que o pai.
// Nome do FILHO: cor levemente mais clara + peso médio (sem negrito) + 1px menor → leitura mais leve.
export const planNameLinkChild = style([
  planNameLink,
  {
    color: planejamento.childName,
    fontWeight: brand.weight.medium,
    fontSize: sz.childNameFont,
  },
])

// Subtítulo (versionLabel): 12.5px ink500.
export const versionLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: sz.subFont,
  color: brand.color.ink500,
})

// ── Conector de árvore (linha vertical + nó + ramo horizontal) ──
export const connector = style({
  position: 'absolute',
  insetInlineStart: sz.treeInsetX,
  insetBlockStart: sz.treeInsetY,
  insetBlockEnd: sz.treeInsetY,
  inlineSize: sz.treeWidth,
  flexShrink: 0,
  selectors: {
    // Linha vertical.
    '&::before': {
      content: '""',
      position: 'absolute',
      insetInlineStart: sz.treeLineOffset,
      insetBlockStart: 0,
      insetBlockEnd: 0,
      inlineSize: sz.treeLineWidth,
      background: planejamento.treeLine,
    },
    // Ramo horizontal (nó).
    '&::after': {
      content: '""',
      position: 'absolute',
      insetInlineStart: sz.treeLineOffset,
      insetBlockStart: '50%',
      inlineSize: sz.treeBranch,
      blockSize: sz.treeLineWidth,
      background: planejamento.treeLine,
    },
  },
})

// Última sub-linha do grupo: a linha vertical para na metade (não continua abaixo do nó).
export const connectorLast = style({
  selectors: {
    '&::before': { insetBlockEnd: '50%' },
  },
})

// Nó do conector (círculo com borda primary).
export const connectorDot = style({
  position: 'absolute',
  insetInlineStart: sz.treeDotInset,
  insetBlockStart: '50%',
  transform: 'translateY(-50%)',
  inlineSize: sz.treeDot,
  blockSize: sz.treeDot,
  borderRadius: '50%',
  background: brand.color.surface,
  border: `${sz.treeDotBorder} ${brand.color.primary}`,
  zIndex: 1,
})

// Total (linha-pai): 700 ink900, tabular; zero = ink400 500.
export const totalCell = style({
  fontFamily: vars.font.family.heading,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  whiteSpace: 'nowrap',
})
export const totalCellZero = style([
  totalCell,
  { color: brand.color.ink400, fontWeight: brand.weight.medium },
])
// Valor do FILHO: peso médio (sem negrito) + 1px menor → alinhado ao nome mais leve das linhas-filhas.
export const totalCellChild = style([
  totalCell,
  { fontWeight: brand.weight.medium, fontSize: sz.childNameFont },
])
export const totalCellChildZero = style([totalCellZero, { fontSize: sz.childNameFont }])

// Parceiros: ink700.
export const partners = style({ color: brand.color.ink700, whiteSpace: 'nowrap' })

// ── Badges de status (pill 12px 600 + dot 7px) ──
export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.xs,
  paddingBlock: sz.badgePadBlock,
  paddingInlineStart: sz.badgePadStart,
  paddingInlineEnd: sz.badgePadEnd,
  borderRadius: brand.radius.pill,
  fontFamily: vars.font.family.heading,
  fontSize: sz.badgeFont,
  fontWeight: brand.weight.semibold,
  letterSpacing: '.01em',
  whiteSpace: 'nowrap',
})
export const badgeTone = styleVariants({
  neutral: { background: planejamento.draftBg, color: planejamento.draftFg },
  info: { background: brand.color.cadBg, color: brand.color.cadFg },
  success: { background: brand.color.okBg, color: brand.color.okFg },
})
export const badgeDot = style({ inlineSize: sz.dot, blockSize: sz.dot, borderRadius: '50%' })
export const badgeDotTone = styleVariants({
  neutral: { background: planejamento.draftDot },
  info: { background: brand.color.cadDot },
  success: { background: brand.color.okDot },
})

// Última alteração: who (ink700 500) + when (ink500 12.5px).
export const auditCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sz.nameGap,
  fontFamily: vars.font.family.heading,
})
export const auditWho = style({ color: brand.color.ink700, fontWeight: brand.weight.medium })
export const auditWhen = style({ color: brand.color.ink500, fontSize: sz.subFont })

// Ícone de ordenação (↕) no cabeçalho do Total.
export const sortIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sz.sortGap,
})
export const sortIconGlyph = style({ opacity: 0.55, marginInlineStart: sz.sortGap })

// ── Rodapé "Total geral" ──
export const footerRow = style({
  background: brand.color.surfaceAlt,
  borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

export const footerLabel = style({
  paddingBlock: sz.rowPadBlock,
  paddingInline: brand.size.rowPadInline,
  whiteSpace: 'nowrap',
})

export const footerLabelContent = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: sz.footerGap,
  fontFamily: vars.font.family.heading,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
})

// Chip de ícone (pasta) do rodapé.
export const footerIcon = style({
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  inlineSize: sz.planIcon,
  blockSize: sz.planIcon,
  borderRadius: brand.radius.iconSm,
  background: brand.color.cadBg,
  color: brand.color.primary,
})

// Valor grand: 700 15px primary, tabular.
export const footerTotal = style({
  paddingBlock: sz.rowPadBlock,
  paddingInline: brand.size.rowPadInline,
  textAlign: 'end',
  fontFamily: vars.font.family.heading,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: brand.weight.bold,
  fontSize: sz.grandFont,
  color: brand.color.primary,
  whiteSpace: 'nowrap',
})

// Estado vazio / carregando / erro dentro da tabela.
export const stateCell = style({
  paddingBlock: brand.space.xxl,
  paddingInline: brand.size.rowPadInline,
  textAlign: 'center',
  color: brand.color.ink500,
  fontFamily: vars.font.family.heading,
})
