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
    // `:not(:disabled)`: o hover destacava o item MESMO desabilitado, reforçando a promessa falsa de clique.
    '&:hover:not(:disabled)': { background: brand.color.surfaceAlt },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: `-${vars.focusRing.width}`,
    },
    /**
     * Item desabilitado tem que PARECER desabilitado. Antes não havia regra `:disabled` nenhuma: ele mantinha
     * a cor cheia, o `cursor: pointer` e o realce no hover — pixel a pixel igual a um item ativo. A P.O. clicou
     * no "Excluir Plano" barrado (plano aprovado), nada aconteceu, e concluiu que a função não tinha sido
     * ligada — o motivo só existia no `title`, que exige hover e paciência.
     *
     * Espelha o padrão que o DS já usa (`brand-filters.css.ts`): tom `ink400` + `not-allowed`. O `ink400` aqui
     * também neutraliza o vermelho do `itemDanger` (a pseudo-classe tem mais especificidade que a cor-base),
     * e isso é proposital: item barrado não deve gritar "ação destrutiva disponível".
     */
    '&:disabled': {
      color: brand.color.ink400,
      cursor: 'not-allowed',
    },
  },
})

/** Ação destrutiva (Excluir) — texto em tom de erro. Desabilitado, cai no `ink400` do `&:disabled` acima. */
export const itemDanger = style([item, { color: brand.color.dangerFg }])
