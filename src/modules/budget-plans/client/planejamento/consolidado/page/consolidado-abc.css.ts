/**
 * Layout da página Consolidado ABC (HANDBOOK §2). Cartão branco com o cabeçalho "{ano} ABC" + Total +
 * subtotais por programa, a barra de filtros e a matriz Centro × meses (ou estado vazio). Dentro da área de
 * conteúdo do shell (rola o próprio conteúdo). Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  blockSize: '100%',
  overflowY: 'auto',
  fontFamily: vars.font.family.body,
})

// Card do RESULTADO ("{ano} ABC") — próprio card, como no mock (não tudo num painel só). Borda leve + branco.
export const resultCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
})

// Chip do ícone ao lado do título "Consolidado ABC" (mock): chip mais ALTO (~3.25rem/52px) p/ preencher a
// ALTURA do título + subtítulo, ícone ~28, ancorado ao TOPO do bloco de texto. Tinta índigo (mesmo padrão do
// titleIcon de Planejamento). `alignSelf:flex-start` mantém o chip alinhado ao topo dentro do leftGroup.
export const titleIcon = style({
  flexShrink: 0,
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '3.25rem',
  blockSize: '3.25rem',
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 10%, white)`,
  color: vars.color.nav.background,
})

// Cabeçalho do resultado ("{ano} ABC") com chip de ícone menor (prancheta) à esquerda — mock §2.
export const resultTitleGroup = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

// Chip da prancheta ("{ano} ABC") — um degrau maior p/ acompanhar o bloco título + subtítulo do resultado.
export const resultTitleIcon = style({
  flexShrink: 0,
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: `calc(${vars.space.xl} + ${vars.space.xs})`,
  blockSize: `calc(${vars.space.xl} + ${vars.space.xs})`,
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 10%, white)`,
  color: vars.color.nav.background,
})

export const resultHeader = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
})

// Bloco de texto do resultado: título "{ano} ABC" + linha "Programa {sigla}: R$ …" empilhados.
export const resultTitleText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  minInlineSize: 0,
})

// Título "{ano} ABC" — bold PRETO (mock §2), Nunito.
export const resultTitle = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const totalLine = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: vars.space.xs,
  fontFamily: vars.font.family.body,
})

// Rótulo "Total:" — pequeno e cinza (mock §2).
export const totalLabel = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

// Valor total em destaque — AZUL de marca, bold e MAIOR (mock §2).
export const totalValue = style({
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.brand.normal,
  fontVariantNumeric: 'tabular-nums',
})

export const subtotals = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.md,
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

// "Programa {sigla}: R$ …" — cinza; a SIGLA do programa vem em azul (subtotalProgram).
export const subtotalItem = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
  fontVariantNumeric: 'tabular-nums',
})

// Sigla do programa (ex.: "ETI") em AZUL de marca (mock §2).
export const subtotalProgram = style({
  color: vars.color.brand.normal,
  fontWeight: vars.font.weight.semibold,
})

export const empty = style({
  padding: vars.space.xl,
  textAlign: 'center',
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.canvas,
})
