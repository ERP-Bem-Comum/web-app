import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// TELA do autocadastro (rota pública): viewport inteiro, scroll vertical (o form tem 6 seções),
// fundo com as formas decorativas da marca. Reusa a linguagem visual do login sem centralizar um card.
export const screen = style({
  boxSizing: 'border-box',
  inlineSize: '100%',
  blockSize: '100dvh',
  overflowY: 'auto',
  position: 'relative',
  backgroundColor: vars.color.surface.subtle,
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.border.default} transparent`,
})

// Forma decorativa — canto superior direito (fixa, ignora o scroll).
export const shapeTopRight = style({
  position: 'fixed',
  insetBlockStart: 0,
  insetInlineEnd: 0,
  inlineSize: '55vw',
  blockSize: '55vw',
  background: vars.color.brand.normal,
  opacity: 0.16,
  borderRadius: '0 0 0 55%',
  transform: 'translate(35%, -35%)',
  pointerEvents: 'none',
  zIndex: 0,
})

// Forma decorativa — canto inferior esquerdo.
export const shapeBottomLeft = style({
  position: 'fixed',
  insetBlockEnd: 0,
  insetInlineStart: 0,
  inlineSize: '45vw',
  blockSize: '45vw',
  background: vars.color.brand.normal,
  opacity: 0.12,
  borderRadius: '0 55% 0 0',
  transform: 'translate(-35%, 35%)',
  pointerEvents: 'none',
  zIndex: 0,
})

// Coluna de conteúdo: centralizada, largura confortável para o form; acima das formas (zIndex).
export const container = style({
  position: 'relative',
  zIndex: 1,
  marginInline: 'auto',
  maxInlineSize: '72rem',
  paddingBlock: vars.space.xl,
  paddingInline: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
})

// Card branco que emoldura o estado "convite inválido" (centralizado, como o login).
export const invalidWrapper = style({
  position: 'relative',
  zIndex: 1,
  marginInline: 'auto',
  marginBlockStart: '12vh',
  inlineSize: '100%',
  maxInlineSize: '28rem',
  background: vars.color.surface.default,
  borderRadius: vars.radius.xl,
  boxShadow: vars.shadow.cardElevated,
  paddingBlock: vars.space.xl,
  paddingInline: vars.space.xl,
})

// Estado de carregamento do preview (texto discreto, centralizado).
export const loading = style({
  position: 'relative',
  zIndex: 1,
  marginBlockStart: '20vh',
  textAlign: 'center',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})
