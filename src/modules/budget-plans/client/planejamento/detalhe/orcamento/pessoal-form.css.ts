/**
 * Estilos EXTRA dos formulários dentro do drawer (Pessoal/CAED/Logística) no padrão "brand": grids de campos
 * (`grid2`/`grid3`) e as caixas de resumo (Custo Mensal/Anual). O grosso (seção, campo, input, chevron, derived,
 * pills de mês, botões) vem de `calculando-gastos.css.ts`. Cores/px fora do kit em `calculando-gastos.values.ts`.
 * Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

import { calcGastos as cg } from './calculando-gastos.values.ts'

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.gridRow,
})

export const row2 = style({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: cg.size.fieldGap })
export const row3 = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: cg.size.fieldGap })

// Bloco Custo Total (Mensal | Anual) — caixa de resumo tingida (mesmo estilo dos sumbox do mock).
export const custoGrid = style({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: brand.space.md })

export const custoCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xxs,
  alignItems: 'center',
  padding: cg.size.sumboxPad,
  borderRadius: cg.size.sumboxRadius,
  background: cg.color.tintBlue,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  textAlign: 'center',
})

export const custoCellLabel = style({ fontSize: cg.size.sumboxLabelFont, color: brand.color.ink500 })

export const custoCellValue = style({
  fontSize: cg.size.sumboxValFont,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
})
