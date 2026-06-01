import { style } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

// Átomo Card: superfície neutra (fundo + radius + sombra + padding). Burro, só-tokens.
// NÃO fixa max-width — a largura é do CONSUMIDOR (layout do login, próxima spec).
// `as` ('div' | 'section') é decisão da View; aqui só o estilo da superfície.
export const card = style({
  // 100% do espaço que o pai der; quem limita a largura é o consumidor, não o Card.
  inlineSize: '100%',
  // logical property: o padding acompanha o fluxo do texto (RTL-safe), nunca padding-left/top.
  padding: vars.space.xl,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  boxShadow: vars.shadow.card,
})
