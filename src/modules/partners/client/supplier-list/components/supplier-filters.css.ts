/**
 * Estilos do filtro de Fornecedores = modelo compartilhado (`shared/filters.css.ts`) + chip aplicado
 * na cor de Fornecedor (azul). Fonte de verdade do visual: `partners/client/shared/filters.css.ts`.
 */
import { appliedChipVariant, appliedChipRemoveVariant } from '#modules/partners/client/shared/filters.css.ts'

export * from '#modules/partners/client/shared/filters.css.ts'

export const appliedChip = appliedChipVariant.supplier
export const appliedChipRemove = appliedChipRemoveVariant.supplier
