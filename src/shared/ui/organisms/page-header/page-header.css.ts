import { style } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

/**
 * Estilos do PageHeader — vanilla-extract, SÓ `vars.*`. Layout: título (+subtítulo) à esquerda,
 * slot de ações à direita; quebra para coluna em viewport estreito.
 */
export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
  marginBlockEnd: vars.space.lg,
})

export const titleGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: 0,
})

export const title = style({
  margin: 0,
  // Título das telas em Nunito (padrão definido com a stakeholder) — corpo, não heading.
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  lineHeight: 1.2,
})

export const subtitle = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexShrink: 0,
})

// Grupo da esquerda: botão voltar (opcional) + título/subtítulo.
export const leftGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minInlineSize: 0,
})

// Botão voltar — quadrado arredondado com borda da marca (à esquerda do título).
export const backButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2.25rem',
  blockSize: '2.25rem',
  flexShrink: 0,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.brand.normal}`,
  background: vars.color.surface.default,
  color: vars.color.brand.normal,
  cursor: 'pointer',
  transitionProperty: 'background-color, color',
  transitionDuration: '150ms',
  selectors: {
    '&:hover': { background: vars.color.brand.normal, color: vars.color.brand.onBrand },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
  },
})
