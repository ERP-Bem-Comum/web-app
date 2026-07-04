/**
 * Estilos da tabela dedicada de Colaboradores (mock "colaboradores-brand"). Grid de 7 colunas, cartão com
 * sombra suave, thead uppercase, linhas com hover, avatar de iniciais e chips (Ativo/Inativo/Cadastrado/
 * Pré-cadastro). Consome os tokens ESCOPADOS `collab` (paleta do mock) + `vars` só p/ fonte/anel de foco.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

import { collab } from '../collab-brand.values.ts'

export const card = style({
  background: collab.color.surface,
  border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
  borderRadius: collab.radius.lg,
  boxShadow: collab.shadow.card,
  overflow: 'hidden',
  fontFamily: vars.font.family.heading, // Inter
  color: collab.color.ink700,
  fontSize: collab.text.body,
})

const grid = style({
  display: 'grid',
  gridTemplateColumns: collab.cols,
  alignItems: 'center',
})

export const thead = style([
  grid,
  {
    background: collab.color.surfaceAlt,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${collab.color.line}`,
    paddingBlock: collab.size.theadPadBlock,
    paddingInline: collab.size.rowPadInline,
    fontSize: collab.text.thead,
    fontWeight: collab.weight.semibold,
    letterSpacing: '.03em',
    textTransform: 'uppercase',
    color: collab.color.ink500,
  },
])

export const row = style([
  grid,
  {
    paddingBlock: collab.size.rowPadBlock,
    paddingInline: collab.size.rowPadInline,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${collab.color.line2}`,
    transition: `background ${collab.ease}`,
    selectors: {
      '&:last-child': { borderBlockEnd: 'none' },
    },
  },
])

export const rowClickable = style({
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: collab.color.rowHover },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${collab.color.primary}`,
      outlineOffset: `calc(-1 * ${vars.focusRing.width})`,
    },
  },
})

// Célula genérica (truncável).
export const cell = style({
  minInlineSize: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const email = style([cell, { color: collab.color.ink700 }])
export const muted = style([cell, { color: collab.color.ink500 }])
export const numZero = style({ color: collab.color.zeroNum })

// Coluna Nome — avatar + nome.
export const person = style({
  display: 'flex',
  alignItems: 'center',
  gap: collab.space.md,
  minInlineSize: 0,
})

export const avatar = style({
  inlineSize: collab.size.avatar,
  blockSize: collab.size.avatar,
  flexShrink: 0,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  // Mantém o AMARELO de Colaborador do DS (pedido da P.O. — não migrar p/ o azul do mock).
  background: vars.color.partnerType.collaborator.background,
  color: vars.color.partnerType.collaborator.text,
  fontSize: collab.text.avatar,
  fontWeight: collab.weight.bold,
  textTransform: 'uppercase',
})

export const name = style([
  cell,
  {
    fontWeight: collab.weight.semibold,
    color: collab.color.ink900,
  },
])

// Linha de estado (loading/empty/error) — ocupa a largura toda.
export const stateRow = style({
  paddingBlock: collab.space.xxl,
  paddingInline: collab.size.rowPadInline,
  textAlign: 'center',
  color: collab.color.ink500,
})

export const errorRow = style([stateRow, { color: collab.color.dangerFg }])

// ── Chips (pill) ──
export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: collab.space.xs,
  paddingBlock: collab.size.chipPadBlock,
  paddingInlineStart: collab.size.chipPadStart,
  paddingInlineEnd: collab.size.chipPadEnd,
  borderRadius: collab.radius.pill,
  fontSize: collab.text.chip,
  fontWeight: collab.weight.semibold,
  letterSpacing: '.02em',
  whiteSpace: 'nowrap',
})

export const dot = style({
  inlineSize: collab.size.dot,
  blockSize: collab.size.dot,
  borderRadius: '50%',
})

export const chipTone = styleVariants({
  ok: { background: collab.color.okBg, color: collab.color.okFg },
  danger: { background: collab.color.dangerBg, color: collab.color.dangerFg },
  cad: { background: collab.color.cadBg, color: collab.color.cadFg },
  warn: { background: collab.color.warnBg, color: collab.color.warnFg },
})

export const dotTone = styleVariants({
  ok: { background: collab.color.okDot },
  danger: { background: collab.color.dangerDot },
  cad: { background: collab.color.cadDot },
  warn: { background: collab.color.warnDot },
})
