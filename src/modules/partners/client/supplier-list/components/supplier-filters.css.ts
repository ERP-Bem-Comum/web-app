/**
 * Estilos do filtro de Fornecedores = kit "brand" + chip de filtro aplicado na COR do tipo (azul,
 * igual ao avatar). Sobrescreve `appliedChip`/`appliedChipRemove` da kit (shadow do `export *`).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { appliedChipBase, appliedChipRemoveBase } from '#shared/ui/brand/brand-filters.css.ts'

export * from '#shared/ui/brand/brand-filters.css.ts'

export const appliedChip = style([
  appliedChipBase,
  {
    background: vars.color.partnerType.supplier.background,
    borderColor: vars.color.partnerType.supplier.border,
    color: vars.color.partnerType.supplier.text,
  },
])
export const appliedChipRemove = style([
  appliedChipRemoveBase,
  { color: vars.color.partnerType.supplier.text },
])
