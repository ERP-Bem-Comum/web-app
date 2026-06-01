import { style } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

// Átomo Checkbox (login: "lembrar-me"). Input NATIVO type="checkbox", estilizado por
// `accent-color` — a11y nativa, barato (css/responsive-a11y.md). Burro, só-tokens,
// sem <label> interno. Foco casa com Button/Input (border.focus + focusRing como outline).
export const checkbox = style({
  // caixa de toque previsível em unidades de tipografia (escala com o tema), via logical props.
  inlineSize: vars.font.size.md,
  blockSize: vars.font.size.md,
  margin: 0,
  cursor: 'pointer',
  // a marca tinge o "check" nativo — sem checkbox custom, sem input escondido.
  accentColor: vars.color.brand.normal,
  transitionProperty: 'outline-color',
  transitionDuration: '150ms',
  selectors: {
    // foco por teclado: mesmo padrão do Button/Input (focusRing como outline + border.focus)
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
    // desabilitado: cursor + esmaecido derivado do próprio token (color-mix com transparent),
    // sem novo hex e sem token de opacidade dedicado (css/color.md).
    '&:disabled': {
      cursor: 'not-allowed',
      accentColor: `color-mix(in oklab, ${vars.color.brand.normal} 50%, transparent)`,
    },
  },
  '@media': {
    // respeita quem desabilitou movimento (css/responsive-a11y.md)
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
  },
})
