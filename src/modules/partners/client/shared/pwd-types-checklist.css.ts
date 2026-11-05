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

// A <legend> de um <fieldset> não participa do `gap` do contêiner — o respiro até as opções vem daqui.
export const legend = style({
  padding: 0,
  marginBlockEnd: brand.space.sm,
  fontSize: brand.text.label,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink700,
})

// Opções em sequência, com o mesmo espaço entre elas; quebram de linha quando não cabem. Uma grade de
// colunas iguais espalhava as caixas com vãos irregulares na seção larga.
export const options = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: brand.space.xl,
  rowGap: brand.space.sm,
})

// Campo que entra NA MESMA LINHA das opções (o texto de "Outra", P.O. 23/10): ocupa a sobra da linha e só
// desce quando não cabe a largura mínima de um campo.
export const trailing = style({
  flex: '1 1 18rem',
  maxInlineSize: '28rem',
  minInlineSize: 0,
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
