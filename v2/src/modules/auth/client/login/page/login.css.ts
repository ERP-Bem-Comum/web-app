import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Layout da TELA de login: ocupa o viewport inteiro e centraliza o card. Burro, só-tokens.
// A imagem de fundo tem cor de fallback (FR-011) caso não carregue.
export const screen = style({
  // viewport dinâmico: acompanha as barras do navegador no mobile sem cortar o card (css/units.md).
  minBlockSize: '100dvh',
  display: 'grid',
  placeItems: 'center',
  // respiro p/ o card não colar na borda no mobile — token, nunca px cru.
  padding: vars.space.lg,
  // fallback PRIMEIRO: se a imagem falhar, fica a cor de canvas (FR-011), não branco/transparente.
  backgroundColor: vars.color.surface.canvas,
  backgroundImage: 'url(/images/backgroundLogin.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
})
