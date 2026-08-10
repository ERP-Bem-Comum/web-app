/**
 * Layout da página de Planejamento (lista) no padrão visual "brand" (mock `planejamento-brand`): container
 * full-bleed com fundo cinza + rolagem própria (espelha o `screen` de `brand-page`/`geography`), cabeçalho
 * com chip de ícone + título/subtítulo. A rota já é marcada full-bleed no shell. Só tokens/values (§X).
 */
import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { planejamento } from '../planejamento.values.ts'

// BLOCO (não flex column): os filhos ficam em fluxo de bloco (não encolhem) → o `screen` ROLA de verdade.
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

// Filhos não encolhem (senão a tabela é espremida ao invés de o container rolar).
globalStyle(`${screen} > *`, { flexShrink: 0 })

// ── Cabeçalho da página: chip de ícone (46px) + título/subtítulo ──
export const pageHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.lg,
  marginBlockEnd: brand.space.xl,
})

export const pageIcon = style({
  inlineSize: planejamento.size.pageIcon,
  blockSize: planejamento.size.pageIcon,
  flexShrink: 0,
  borderRadius: brand.radius.md,
  background: brand.color.cadBg,
  color: brand.color.primary,
  display: 'grid',
  placeItems: 'center',
})

// Espaço entre o card (tabela + paginador) e a toolbar.
export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xl,
})
