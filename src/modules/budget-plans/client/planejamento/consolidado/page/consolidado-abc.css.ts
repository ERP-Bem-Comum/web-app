/**
 * Layout da página Consolidado ABC no padrão visual "brand" (mock `consolidado-brand`): container full-bleed
 * (fundo cinza + rolagem própria, LARGURA CHEIA — sem centralizar), cabeçalho com chip de ícone (pizza) +
 * título/subtítulo, e o card RESUMO ("{ano} ABC" + Total + tag do programa). Espelha o `screen` de
 * `planejamento-list.css.ts`. Cores/px fora do kit vivem em `consolidado.values.ts`; o resto vem de
 * `brand`/`vars`. Só tokens (§X).
 */
import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { consolidado } from '../consolidado.values.ts'

// BLOCO (não flex column): os filhos ficam em fluxo de bloco (não encolhem) → o `screen` ROLA de verdade e a
// matriz gera seu próprio scroll horizontal em vez de ser espremida.
export const screen = style({
  padding: brand.space.xxl,
  blockSize: '100%',
  overflowY: 'auto',
  background: brand.color.pageBg,
  fontFamily: vars.font.family.heading, // Inter
  color: brand.color.ink700,
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.625rem' },
    '&::-webkit-scrollbar-thumb': { background: brand.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

// Filhos não encolhem (senão a matriz é espremida ao invés de o container rolar).
globalStyle(`${screen} > *`, { flexShrink: 0 })

// ── Cabeçalho da página: chip de ícone (46px, pizza) + título/subtítulo ──
export const pageHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.lg,
  marginBlockEnd: brand.space.xl,
})

export const pageIcon = style({
  inlineSize: consolidado.size.pageIcon,
  blockSize: consolidado.size.pageIcon,
  flexShrink: 0,
  borderRadius: brand.radius.md,
  background: brand.color.cadBg,
  color: brand.color.primary,
  display: 'grid',
  placeItems: 'center',
})

// ── Card RESUMO ("{ano} ABC") ──
export const resultCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.lg,
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  padding: `${brand.space.xl} ${brand.space.xl}`,
  marginBlockEnd: brand.space.xl,
})

// Chip da prancheta ("{ano} ABC") — 44px, cadBg/primary, radius md.
export const resultTitleIcon = style({
  inlineSize: consolidado.size.summaryDoc,
  blockSize: consolidado.size.summaryDoc,
  flexShrink: 0,
  borderRadius: brand.radius.md,
  background: brand.color.cadBg,
  color: brand.color.primary,
  display: 'grid',
  placeItems: 'center',
})

// Bloco de texto do resumo: título "{ano} ABC".
export const resultTitleText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: consolidado.size.nameGap,
  minInlineSize: 0,
})

// Título "{ano} ABC" — 17px 700 ink900.
export const resultTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: consolidado.size.summaryTitle,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

// Bloco "Total" à direita.
export const totalLine = style({
  marginInlineStart: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  textAlign: 'end',
  fontFamily: vars.font.family.heading,
})

// Rótulo "Total" — 12px ink500.
export const totalLabel = style({
  fontSize: brand.text.label,
  color: brand.color.ink500,
})

// Valor total — 24px 700 primary, tabular.
export const totalValue = style({
  fontSize: consolidado.size.summaryTotalVal,
  fontWeight: brand.weight.bold,
  color: brand.color.primary,
  letterSpacing: '-.01em',
  fontVariantNumeric: 'tabular-nums',
})

// Estado vazio.
export const empty = style({
  padding: brand.space.xxl,
  textAlign: 'center',
  color: brand.color.ink500,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  borderRadius: brand.radius.lg,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surface,
})
