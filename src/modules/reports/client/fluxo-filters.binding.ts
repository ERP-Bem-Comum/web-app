/**
 * Opções dos filtros do "Fluxo de Caixa" (#590) — ADAPTER React (§XI). REUSA os blocos já prontos: Programa do
 * "Realizado × Planejado" (`useProgramaOptions`) e Plano/Conta + a CASCATA Centro/Categoria/Subcategoria da
 * árvore do PLANO (ADR-0051) do "Posição de Pagamentos" (`usePosicaoFilterOptions`). O Fluxo tem PROGRAMA (não
 * Fornecedor); os `value` são os UUIDs que o `/reports/cashflow` aplica. Degradação graciosa → [] (o dropdown
 * nunca quebra). Status/período são resolvidos na page.
 */
import { usePosicaoFilterOptions } from './posicao-filters.binding.ts'
import { useProgramaOptions } from './realizado-filters.binding.ts'

export type FilterOption = Readonly<{ value: string; label: string }>

export type FluxoFilterOptions = Readonly<{
  programa: readonly FilterOption[]
  plano: readonly FilterOption[]
  conta: readonly FilterOption[]
  centro: readonly FilterOption[]
  categoria: readonly FilterOption[]
  subcategoria: readonly FilterOption[]
}>

/**
 * Agrega as 6 listas dos filtros do Fluxo. Centro/Categoria/Subcategoria vêm da CASCATA da árvore do plano
 * selecionado (`planoRef` → `costCenterRef` → `categoryRef`) — trocar o plano recarrega os 3, etc. Os hooks
 * rodam SEMPRE, antes de qualquer early-return (Rules of Hooks).
 */
export function useFluxoFilterOptions(
  planoRef: string,
  costCenterRef: string,
  categoryRef: string,
): FluxoFilterOptions {
  const pos = usePosicaoFilterOptions(planoRef, costCenterRef, categoryRef)
  return {
    programa: useProgramaOptions(),
    plano: pos.plano,
    conta: pos.conta,
    centro: pos.centro,
    categoria: pos.categoria,
    subcategoria: pos.subcategoria,
  }
}
