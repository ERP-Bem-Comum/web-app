/**
 * Estilos do filtro de Colaboradores = modelo compartilhado (`shared/filters.css.ts`) + chip aplicado
 * na cor de Colaborador (âmbar). Fonte de verdade do visual: `partners/client/shared/filters.css.ts`.
 */
import { appliedChipVariant, appliedChipRemoveVariant } from '#modules/partners/client/shared/filters.css.ts'

export * from '#modules/partners/client/shared/filters.css.ts'

export const appliedChip = appliedChipVariant.collaborator
export const appliedChipRemove = appliedChipRemoveVariant.collaborator
