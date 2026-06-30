/**
 * Export dropdown (Contas a Pagar) — estilos (vanilla-extract, só-tokens §X). Espelha o do grid de
 * Contratos (CSV/PDF). `<details>` nativo: trigger + menu flutuante.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const wrapper = style({ position: 'relative', display: 'inline-flex' })

export const trigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingInline: vars.space.md,
  paddingBlock: vars.space.sm,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink3,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  fontFamily: vars.font.family.body,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.paperWarm, borderColor: vars.color.institutional.ink4 },
})

export const menu = style({
  position: 'absolute',
  insetBlockEnd: 'calc(100% + 0.25rem)', // abre p/ CIMA (está no rodapé)
  insetInlineEnd: 0,
  zIndex: 50,
  background: vars.color.surface.default,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.cardElevated,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  minInlineSize: '8.75rem',
  overflow: 'hidden',
})

export const menuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  inlineSize: '100%',
  paddingInline: vars.space.md,
  paddingBlock: vars.space.sm,
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink3,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  fontFamily: vars.font.family.body,
  cursor: 'pointer',
  textAlign: 'start',
  ':hover': { background: vars.color.institutional.paperWarm },
})

export const menuItemBorder = style({
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

// Item indisponível (chrome honesto — funcionalidade pendente no backend): esmaecido e não-clicável.
export const menuItemDisabled = style({
  opacity: 0.5,
  cursor: 'not-allowed',
  ':hover': { background: 'transparent' },
})

// Item com rótulo + dica (padrão do mock: "Aprovar" / "aprova o documento").
export const itemCol = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.0625rem',
  minInlineSize: 0,
})
export const itemHint = style({
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink5,
})
