/**
 * Estilos da TABELA EM ÁRVORE de Planejamento (linha-pai + versões-filhas via chevron). Só tokens (§X).
 * Reproduz o mapa §1.1/§4: cabeçalho azul-claro, chevron de expansão, badge + trilha de auditoria na
 * célula de status, linha expandida com fundo azul-clarinho. A cor não vem por dado aqui — é fixa por token.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const container = style({
  inlineSize: '100%',
  overflowX: 'auto',
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

export const th = style({
  textAlign: 'start',
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.nav.background,
  background: vars.color.surface.canvas,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  whiteSpace: 'nowrap',
})

export const thActions = style([th, { textAlign: 'end', inlineSize: '3rem' }])

export const row = style({
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  transitionProperty: 'background-color',
  transitionDuration: '120ms',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
  },
})

/** Linha-filha (versão) — recuo visual + fundo azul-clarinho, como no legado. */
export const childRow = style([row, { background: vars.color.surface.canvas }])

export const td = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  verticalAlign: 'middle',
})

export const tdActions = style([td, { textAlign: 'end' }])

/** Célula do nome: chevron (se tem filhos) + nome + rótulo/subtítulo da versão. */
export const nameCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minInlineSize: 0,
})

export const indent = style({
  display: 'inline-block',
  inlineSize: vars.space.lg,
  flexShrink: 0,
})

export const chevronButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.5rem',
  blockSize: '1.5rem',
  flexShrink: 0,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  cursor: 'pointer',
  borderRadius: vars.radius.sm,
  selectors: {
    '&:hover': { background: vars.color.surface.subtle, color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const nameText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  minInlineSize: 0,
})

export const planName = style({
  fontFamily: vars.font.family.heading,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

/** Nome clicável (vai ao detalhe do plano). */
export const planNameLink = style([
  planName,
  {
    background: 'transparent',
    border: 'none',
    padding: 0,
    textAlign: 'start',
    cursor: 'pointer',
    color: vars.color.nav.background,
    selectors: {
      '&:hover': { textDecoration: 'underline' },
      '&:focus-visible': {
        outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
        outlineOffset: vars.focusRing.offset,
      },
    },
  },
])

export const versionLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})

/** Célula de status: badge em cima, trilha de auditoria embaixo. */
export const statusCell = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: vars.space.xs,
})

export const auditTrail = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})

export const totalCell = style({
  fontFamily: vars.font.family.heading,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

/** Estado vazio / carregando / erro dentro da tabela. */
export const stateCell = style({
  padding: vars.space.xl,
  textAlign: 'center',
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
})
