import { style } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

// Átomo Input (login: text/email/password). Burro, só-tokens, sem <label> interno.
// Estado de erro derivado de `aria-invalid="true"` no próprio elemento (decisão da spec);
// foco casa com o Button (focusRing + border.focus). Um único style(), sem variantes.
export const input = style({
  inlineSize: '100%',
  // CRÍTICO: sem border-box, padding + border somam À LARGURA e estouram o container.
  boxSizing: 'border-box',
  // borda hairline via TOKEN (o lint só-tokens proíbe `px` cru, inclusive 1px em template).
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  borderRadius: vars.radius.md,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
  background: vars.color.surface.default,
  // a marca tinge o caret e a seleção nativa — a11y nativa, barato (css/responsive-a11y.md)
  accentColor: vars.color.brand.normal,
  transitionProperty: 'border-color',
  transitionDuration: '150ms',
  selectors: {
    '&::placeholder': { color: vars.color.text.muted },
    // desabilitado: campo somente-leitura (ex.: CNPJ/CPF vital na edição)
    '&:disabled': {
      background: vars.color.surface.subtle,
      color: vars.color.text.muted,
      cursor: 'not-allowed',
    },
    // foco por teclado: mesmo padrão do Button (border.focus + focusRing como outline)
    '&:focus-visible': {
      borderColor: vars.color.border.focus,
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
    // erro: borda vermelha quando o componente marca aria-invalid (gancho acessível/testado)
    '&[aria-invalid="true"]': {
      borderColor: vars.color.feedback.errorText,
    },
    // erro tem prioridade sobre o foco — sem isso o foco "apagaria" a borda de erro
    '&[aria-invalid="true"]:focus-visible': {
      borderColor: vars.color.feedback.errorText,
      outlineColor: vars.color.feedback.errorText,
    },
  },
  '@media': {
    // respeita quem desabilitou movimento (css/responsive-a11y.md)
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
  },
})
