/**
 * Estilos do FORMULÁRIO de custo de Pessoal (US2.4c) — grid de campos em seções. Reusa `field`/`fieldLabel`/
 * `fieldInput`/`configSection`/… do CalculandoGastos. Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  // Sem scroll próprio: a área de colunas rola; o rodapé de ações (formActions) é uma barra fixa full-width.
})

export const row2 = style({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: vars.space.sm })
export const row3 = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: vars.space.sm })

// Campo derivado (Salário Total, Total Encargos…) — cinza, só leitura.
export const derivedInput = style({
  inlineSize: '100%',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.subtle,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontVariantNumeric: 'tabular-nums',
})

// Bloco Custo Total (Mensal | Anual) — destaque azul da marca.
export const custoGrid = style({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: vars.space.sm })
export const custoCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  alignItems: 'center',
  paddingBlock: vars.space.sm,
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 12%, white)`,
})
export const custoCellLabel = style({ fontSize: vars.font.size.xs, color: vars.color.text.secondary })
export const custoCellValue = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text.primary,
  fontVariantNumeric: 'tabular-nums',
})

// Meses — chips clicáveis compactos (aplica o custo aos meses marcados).
export const mesesRow = style({ display: 'flex', flexWrap: 'wrap', gap: vars.space.xs })
export const mesChip = style({
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  cursor: 'pointer',
})
export const mesChipOn = style({
  background: vars.color.brand.normal,
  borderColor: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
})
