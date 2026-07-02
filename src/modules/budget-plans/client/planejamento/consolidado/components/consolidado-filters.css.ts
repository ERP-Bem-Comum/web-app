/**
 * Estilos da barra de filtros do Consolidado ABC (HANDBOOK §2): Ano Base + Programa(s) + "Filtrar" e, à
 * direita, "Exportar Excel/CSV". Cartão de tom claro sutil (mock), labels em Nunito pequenas cinza ACIMA dos
 * controles, campo Ano Base com ícone de calendário + chevron, botões com ícone (funil / download) e pills de
 * programa com estado selecionado azul-claro + texto de marca. Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const bar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'end',
  gap: vars.space.md,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  // Tom claro sutil como o mock: fundo cinza-clarinho + borda leve (sem contorno pesado).
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.subtle,
})

export const fieldWrap = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: '10rem',
})

// Label "Ano Base"/"Programas" ACIMA do controle — Nunito (body), pequena, cinza (mock).
export const fieldLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.muted,
  whiteSpace: 'nowrap',
})

// Wrapper do campo Ano Base: ícone de calendário à esquerda + chevron à direita, ambos sobre o select.
export const selectWrap = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  inlineSize: '100%',
})

export const selectIcon = style({
  position: 'absolute',
  insetInlineStart: vars.space.sm,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.text.muted,
  pointerEvents: 'none',
})

export const selectChevron = style({
  position: 'absolute',
  insetInlineEnd: vars.space.sm,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.text.muted,
  pointerEvents: 'none',
})

export const select = style({
  blockSize: '2.5rem',
  // Espaço p/ o ícone de calendário (esquerda) e o chevron (direita).
  paddingInlineStart: `calc(${vars.space.sm} + ${vars.space.lg})`,
  paddingInlineEnd: `calc(${vars.space.sm} + ${vars.space.lg})`,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  inlineSize: '100%',
  appearance: 'none',
})

/** Multi-seleção de programas (chips com checkbox). */
export const programChips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
})

const chipBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  // Mesma ALTURA do select "Ano Base" (2.5rem) — controles do filtro alinhados na mesma proporção (mock).
  blockSize: '2.5rem',
  paddingInline: vars.space.md,
  borderRadius: vars.radius.xl,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
export const chip = style([chipBase])

// Pill selecionada (ex.: ETI) — fundo AZUL-CLARO + texto AZUL de marca + borda azul (mock §2).
export const chipActive = style([
  chipBase,
  {
    background: `color-mix(in srgb, ${vars.color.brand.normal} 12%, white)`,
    color: vars.color.brand.normal,
    borderColor: `color-mix(in srgb, ${vars.color.brand.normal} 40%, white)`,
    selectors: {
      '&:hover': { background: `color-mix(in srgb, ${vars.color.brand.normal} 18%, white)` },
    },
  },
])

export const spacer = style({ flex: '1 1 auto' })

const buttonBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  // Mesma altura do select/pills (2.5rem) — linha de controles do filtro alinhada (mock).
  blockSize: '2.5rem',
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
})

// Ícone dentro do botão (funil / download) — alinhado ao texto.
export const buttonIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
})

// "Filtrar" — azul preenchido + ícone de funil (mock §2).
export const applyButton = style([
  buttonBase,
  {
    background: vars.color.brand.normal,
    color: vars.color.brand.onBrand,
    borderColor: vars.color.brand.normal,
    selectors: { '&:hover': { background: vars.color.brand.hover, borderColor: vars.color.brand.hover } },
  },
])

// "Exportar Excel/CSV" — outline + ícone de download (mock §2).
export const exportButton = style([
  buttonBase,
  { background: vars.color.surface.default, color: vars.color.text.primary },
])
