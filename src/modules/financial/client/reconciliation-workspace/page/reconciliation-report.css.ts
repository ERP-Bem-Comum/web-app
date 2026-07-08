/**
 * Estilos do Relatório da Conciliação em PDF (#144) — só-tokens (§X, vars.*), zero-runtime. O relatório vive
 * num bloco OCULTO no workspace: `printOnly` só aparece no `@media print`; `screenBody` (aplicado ao corpo do
 * workspace) some no print. O chrome do shell (`nav, header`) é ocultado globalmente (padrão de Contratos/
 * Relatórios) — no print o PDF contém só o relatório. O cabeçalho do relatório é um `<div>` (não `<header>`),
 * então NÃO é comido por esse `globalStyle`.
 */
import { style, styleVariants, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Impressão (PDF via window.print): esconde o cromo do shell (sidebar + topbar) — igual aos Relatórios.
globalStyle('nav, header', { '@media': { print: { display: 'none !important' } } })

// Bloco de impressão: oculto na tela, visível SÓ no print (o artefato do PDF é só o relatório).
export const printOnly = style({
  display: 'none',
  '@media': { print: { display: 'block' } },
})

// Corpo do workspace (envolve TODO o s.screen atual): pass-through na tela, some no print. `display: contents`
// não gera caixa → zero regressão de layout on-screen; no print vira `none` e some com toda a subárvore.
export const screenBody = style({
  display: 'contents',
  '@media': { print: { display: 'none' } },
})

export const screen = style({
  blockSize: '100%',
  overflowY: 'auto',
  padding: vars.space.xl,
  background: vars.color.surface.app,
  fontFamily: vars.font.family.heading,
  color: vars.color.text.primary,
  '@media': {
    print: {
      padding: 0,
      background: vars.color.surface.default,
      overflow: 'visible',
    },
  },
})

// Folha do relatório (card branco centralizado) — vira o corpo do PDF.
export const sheet = style({
  maxInlineSize: '60rem',
  marginInline: 'auto',
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  padding: vars.space.xl,
  '@media': {
    print: { border: 'none', borderRadius: 0, padding: 0, maxInlineSize: 'none' },
  },
})

export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.md,
  paddingBlockEnd: vars.space.md,
  marginBlockEnd: vars.space.lg,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
})

export const headText = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs })

export const title = style({
  margin: 0,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
})

export const account = style({
  margin: 0,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.secondary,
})

// Identificação da conta COM NÚMERO (banco · Ag · C/C) — abaixo do alias.
export const accountNumber = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const period = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})

// Totalizações — grade de 6 cards.
export const totals = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.md,
  marginBlockEnd: vars.space.lg,
  '@media': { print: { gap: vars.space.sm } },
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  padding: vars.space.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
})

export const cardLabel = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.muted,
})

export const cardValue = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  fontVariantNumeric: 'tabular-nums',
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  fontSize: vars.font.size.sm,
})

export const th = style({
  textAlign: 'left',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.text.secondary}`,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.secondary,
})
export const thRight = style([th, { textAlign: 'right' }])

export const td = style({
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  verticalAlign: 'top',
  color: vars.color.text.primary,
})
export const tdRight = style([td, { textAlign: 'right', fontVariantNumeric: 'tabular-nums' }])

// Valor colorido por MOVIMENTO (entrada=verde, saída=vermelho) — cor por dado, aplicada como classe.
export const value = styleVariants({
  Credit: [tdRight, { color: vars.color.status.activeText }],
  Debit: [tdRight, { color: vars.color.status.terminatedText }],
})

export const tdEmpty = style({
  paddingBlock: vars.space.xl,
  textAlign: 'center',
  color: vars.color.text.muted,
})

// Badge de status (Conciliado=roxo / Pendente=âmbar) — só-tokens.
const badgeBase = style({
  display: 'inline-block',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.sm,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
})
export const badge = styleVariants({
  reconciled: [
    badgeBase,
    { background: vars.color.status.reconciledBg, color: vars.color.status.reconciledText },
  ],
  pending: [badgeBase, { background: vars.color.status.pendingBg, color: vars.color.status.pendingText }],
})

export const empty = style({
  padding: vars.space.xl,
  textAlign: 'center',
  color: vars.color.text.muted,
  fontSize: vars.font.size.md,
})
