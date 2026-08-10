import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Container do conteúdo dinâmico (onde o <Outlet/> de cada rota renderiza).
export const main = style({
  flex: 1,
  // min-block-size:0 (item de grid/flex): sem isto, `main` cresce com o conteúdo (min-height:auto padrão)
  // e o `screen` da rota (100%) nunca ganha overflow → a lista não rola e o scrollbar "some".
  minBlockSize: 0,
  padding: vars.space.xl,
  background: vars.color.nav.surface,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
})

// Conteúdo "full-bleed": zera TODO o padding do shell (topo/laterais/base). O workspace de conciliação
// espelha o mock (hero, abas, corpo e footer encostam nas bordas da área de conteúdo, igual incluir contrato).
// Cada faixa interna gerencia seu próprio paddingInline. Sem margem negativa (não briga com o overflow).
export const mainFullBleed = style({
  padding: 0,
})

export const content = style({
  flex: 1,
  // idem `main`: limita a altura para o `screen` interno (100% + overflow:auto) rolar de verdade.
  minBlockSize: 0,
  overflow: 'hidden',
})

// Legenda BEGE do header do shell — SÓ é renderizada para os grids que têm subtítulo no shell
// (Contas a Pagar e Contas Bancárias, únicas rotas em PAGE_SUBTITLES). Espelha a legenda do grid de
// Contratos (institutional.ink5), mantendo a identidade de "papel" dos grids financeiros. Não usa o
// `headSubtitle` compartilhado (que é cinza-azulado e serve ~20 telas) para não afetá-las.
export const pageSubtitleBeige = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: '0.84375rem',
  color: vars.color.institutional.ink5,
  lineHeight: 1.4,
})

// Faixa do header do shell (título + legenda "brand" dentro). flex-shrink 0 p/ não encolher no flex-column.
// Só é renderizado para os grids de Contas a Pagar e Contas Bancárias — agora full-bleed (main padding 0),
// então o próprio header provê o recuo da MARCA (28px) no topo e nas laterais, igual ao `screen` dos demais
// grids. Assim título e tabela ficam a 28px da barra de menu, alinhados e com folga para a sombra.
export const pageHeader = style({
  display: 'flex',
  alignItems: 'flex-start',
  paddingBlockStart: brand.space.xxl,
  paddingInline: brand.space.xxl,
  marginBlockEnd: vars.space.lg,
  flexShrink: 0,
})
