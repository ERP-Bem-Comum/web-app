import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Layout da TELA de login: viewport inteiro, centraliza o card, fundo com formas decorativas.
export const screen = style({
  inlineSize: '100%',
  blockSize: '100dvh',
  display: 'grid',
  placeItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: vars.color.surface.subtle,
})

// Forma decorativa azul ciano — canto superior direito.
// position: fixed → ancorado no viewport, ignora padding/margin do container.
// Tamanho ampliado + deslocamento grande = "margem infinita" (não se vê onde acaba).
export const shapeTopRight = style({
  position: 'fixed',
  insetBlockStart: 0,
  insetInlineEnd: 0,
  inlineSize: '85vw',
  blockSize: '85vw',
  background: vars.color.brand.normal,
  opacity: 0.22,
  borderRadius: '0 0 0 55%',
  transform: 'translate(45%, -45%)',
  pointerEvents: 'none',
  zIndex: 0,
})

// Forma decorativa azul ciano — canto inferior esquerdo.
export const shapeBottomLeft = style({
  position: 'fixed',
  insetBlockEnd: 0,
  insetInlineStart: 0,
  inlineSize: '65vw',
  blockSize: '65vw',
  background: vars.color.brand.normal,
  opacity: 0.18,
  borderRadius: '0 55% 0 0',
  transform: 'translate(-45%, 45%)',
  pointerEvents: 'none',
  zIndex: 0,
})

// Wrapper do card: barra lateral laranja + card branco.
export const cardWrapper = style({
  position: 'relative',
  zIndex: 1,
  inlineSize: '100%',
  maxInlineSize: '32rem',
  display: 'flex',
  borderRadius: vars.radius.xl,
  overflow: 'hidden',
  boxShadow: vars.shadow.cardElevated,
  marginInline: vars.space.xl,
  marginBlock: vars.space.xl,
})

// Barra lateral laranja (decoração).
export const accentBar = style({
  flexShrink: 0,
  inlineSize: '0.375rem',
  background: vars.color.institutional.orange,
})

// Container do card branco.
export const cardContent = style({
  flex: 1,
  background: vars.color.surface.default,
  paddingBlock: `calc(${vars.space.xl} + ${vars.space.md})`,
  paddingInline: `calc(${vars.space.xl} + ${vars.space.sm})`,
})
