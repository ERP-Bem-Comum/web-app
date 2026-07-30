/**
 * Estilo do seletor de plano do gráfico "Realizado × Previsto" (specs/096 P3). Só-tokens (ADR-0007/§X):
 * nada de hex/px cru. Um <select> nativo discreto no cabeçalho da "Visão geral".
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const select = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.primary,
  background: vars.color.surface.raised,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  cursor: 'pointer',
  maxWidth: '18rem',
  selectors: {
    '&:hover': { borderColor: vars.color.border.default },
    '&:focus-visible': { outline: `${vars.focusRing.width} solid ${vars.color.border.focus}` },
  },
})
