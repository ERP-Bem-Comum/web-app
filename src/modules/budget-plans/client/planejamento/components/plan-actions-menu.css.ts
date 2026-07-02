/**
 * Estilos do menu de ações "…" por linha (HANDBOOK §1.3). Só tokens (§X). Menu simples ancorado no botão;
 * a EXECUÇÃO das ações é no-op/TODO nesta fatia (depende do backend) — aqui é só apresentação.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const wrap = style({
  position: 'relative',
  display: 'inline-flex',
})

export const trigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  selectors: {
    '&:hover': { background: vars.color.surface.subtle, color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const menu = style({
  position: 'absolute',
  insetBlockStart: 'calc(100% + 0.25rem)',
  insetInlineEnd: 0,
  zIndex: 20,
  minInlineSize: '13rem',
  padding: vars.space.xs,
  margin: 0,
  listStyle: 'none',
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.card,
})

export const item = style({
  display: 'block',
  inlineSize: '100%',
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: 'none',
  background: 'transparent',
  textAlign: 'start',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  borderRadius: vars.radius.sm,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: `-${vars.focusRing.width}`,
    },
  },
})

/** Ação destrutiva (Excluir) — texto em tom de erro. */
export const itemDanger = style([item, { color: vars.color.status.terminatedText }])
