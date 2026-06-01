import { style } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

// Molécula Field: empilha label / controle (children) / erro. Burra, só-tokens.
// O componente recebe o controle por `children`; aqui só cuidamos do layout e da
// tipografia do label e da mensagem de erro. Sem `error` → o componente NÃO renderiza
// `errorText` (não reserva espaço): o gap só conta filhos presentes (flex + gap).

// Stack vertical via flex column + gap. `gap` colapsa quando há 2 filhos (label+controle)
// e cresce sozinho com 3 (label+controle+erro) — sem margens órfãs.
export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  inlineSize: '100%',
})

// Label: tipografia de corpo, peso médio para hierarquia leve sobre o controle.
// `display: block` garante que ocupe a linha inteira mesmo fora do flex.
export const label = style({
  display: 'block',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text.secondary,
})

// Mensagem de erro (componente aplica em um elemento com role="alert").
// A cor REFORÇA o sinal; a semântica vem do role — cor não é o único sinal (a11y).
// Fonte menor que o label para subordinar visualmente sem perder legibilidade.
export const errorText = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.feedback.errorText,
})
