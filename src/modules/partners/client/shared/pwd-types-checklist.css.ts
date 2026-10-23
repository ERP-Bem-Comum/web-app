/**
 * Lista de tipos de deficiência (spec 131) — a "Pergunta 2" do PcD, marcação múltipla. Só tokens (`brand.*`).
 */
import { style } from '@vanilla-extract/css'

import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// <fieldset> sem a moldura nativa: o grupo herda o espaçamento dos campos vizinhos.
export const group = style({
  gridColumn: '1 / -1',
  border: 0,
  margin: 0,
  padding: 0,
  minInlineSize: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xs,
})

export const legend = style({
  padding: 0,
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
})

// Duas colunas no desktop, uma no celular — as 7 opções não viram uma tira longa.
export const options = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))',
  gap: brand.space.xs,
})

export const option = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.xs,
  fontSize: brand.text.label,
  color: brand.color.ink700,
  cursor: 'pointer',
  selectors: {
    '&[data-disabled="true"]': { cursor: 'not-allowed', color: brand.color.ink500 },
  },
})
