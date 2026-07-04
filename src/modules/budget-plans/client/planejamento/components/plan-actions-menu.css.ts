/**
 * Estilos do menu de ações "…" por linha, no padrão "brand" (mock `planejamento-brand`): gatilho kebab 30px
 * (ink400, hover bg iconHover) + menu simples ancorado. A EXECUÇÃO das ações é no-op/TODO nesta fatia
 * (depende do backend) — aqui é só apresentação. Cores fora do kit vivem em `planejamento.values.ts`.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { planejamento } from '../planejamento.values.ts'

export const wrap = style({
  position: 'relative',
  display: 'inline-flex',
})

export const trigger = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: planejamento.size.kebab,
  blockSize: planejamento.size.kebab,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: brand.color.ink400,
  borderRadius: planejamento.size.kebabRadius,
  cursor: 'pointer',
  fontFamily: vars.font.family.heading,
  fontSize: planejamento.size.kebabFont,
  lineHeight: 1,
  transition: `all ${brand.ease}`,
  selectors: {
    '&:hover': { background: planejamento.iconHover, color: brand.color.ink700 },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const menu = style({
  position: 'absolute',
  insetBlockStart: 'calc(100% + 0.25rem)',
  insetInlineEnd: 0,
  zIndex: 20,
  minInlineSize: '13rem',
  padding: brand.space.xs,
  margin: 0,
  listStyle: 'none',
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.md,
  boxShadow: brand.shadow.card,
})

export const item = style({
  display: 'block',
  inlineSize: '100%',
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.md,
  border: 'none',
  background: 'transparent',
  textAlign: 'start',
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.dd,
  color: brand.color.ink700,
  borderRadius: brand.radius.xs,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { background: brand.color.surfaceAlt },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: `-${vars.focusRing.width}`,
    },
  },
})

/** Ação destrutiva (Excluir) — texto em tom de erro. */
export const itemDanger = style([item, { color: brand.color.dangerFg }])
