import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

// Átomo Card: superfície neutra (fundo + radius + padding). Burro, só-tokens.
// NÃO fixa max-width — a largura é do CONSUMIDOR (layout do login).
// `as` ('div' | 'section') é decisão da View; aqui só o estilo da superfície.
const base = style({
  // 100% do espaço que o pai der; quem limita a largura é o consumidor, não o Card.
  inlineSize: '100%',
  // logical property: o padding acompanha o fluxo do texto (RTL-safe), nunca padding-left/top.
  padding: vars.space.xl,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
})

// Elevação por variante (escala). `card` = base discreta (sobre fundo branco).
// `elevated` = borda hairline + sombra em camadas: separa a superfície de um fundo claro de baixo
// contraste (ex.: login sobre o canvas ciano). A aresta (borda) não depende só de cor → a11y.
export const card = styleVariants({
  card: [base, { boxShadow: vars.shadow.card }],
  elevated: [
    base,
    {
      boxShadow: vars.shadow.cardElevated,
      borderWidth: vars.borderWidth.thin,
      borderStyle: 'solid',
      borderColor: vars.color.border.subtle,
      // Sob prefers-contrast:more, reforça a aresta com a cor de marca (forte).
      '@media': {
        '(prefers-contrast: more)': { borderColor: vars.color.border.focus },
      },
    },
  ],
})

export type CardElevation = keyof typeof card
