/**
 * Opções dos filtros de "Fornecedores sem Contrato" (#694) — ADAPTER React (§XI). REUSA os blocos já prontos,
 * no mesmo molde do Fluxo de Caixa: Programa do "Realizado × Planejado" (`useProgramaOptions`) e Plano + a
 * CASCATA Centro/Categoria/Subcategoria da árvore do PLANO (ADR-0051) do "Posição de Pagamentos".
 *
 * Os `value` são os UUIDs que o `/reports/suppliers-without-contract` aplica no SERVIDOR (`programId`,
 * `budgetPlanId`, `costCenterId`, `categoryId`, `subCategoryId`) — este relatório não tem nada para recortar
 * no cliente: a resposta traz fornecedor, total, contagem e plano, e mais nada. Degradação graciosa → [].
 *
 * Sem Conta bancária: o endpoint não aceita esse recorte (diferente do Fluxo e da Posição) — não adianta
 * oferecer um dropdown que o servidor ignora.
 */
import { usePosicaoFilterOptions } from './posicao-filters.binding.ts'
import { useProgramaOptions } from './realizado-filters.binding.ts'

export type FilterOption = Readonly<{ value: string; label: string }>

export type SuppliersFilterOptions = Readonly<{
  programa: readonly FilterOption[]
  plano: readonly FilterOption[]
  centro: readonly FilterOption[]
  categoria: readonly FilterOption[]
  subcategoria: readonly FilterOption[]
}>

const EMPTY: readonly FilterOption[] = []

/**
 * Agrega as 5 listas. Centro/Categoria/Subcategoria cascateiam pela árvore do PLANO selecionado — trocar o
 * plano recarrega os 3. Os hooks rodam SEMPRE, antes de qualquer early-return (Rules of Hooks).
 *
 * ⚠️ SEM PLANO ESCOLHIDO → os 3 ficam VAZIOS (só "Todos"). Os hooks do financial caem no **catálogo
 * operacional flat** quando não há plano (`if (!isPlanId(planoRef)) return operational`), e esse catálogo NÃO
 * é a taxonomia: mostra centros/categorias que não existem em plano nenhum. Quem manda na taxonomia é o
 * PLANO (ADR-0051), então oferecer o operacional aqui seria oferecer recorte que o relatório não sabe aplicar.
 * A hierarquia fica explícita na tela: escolha o Plano para abrir Centro → Categoria → Subcategoria.
 *
 * O mesmo fallback existe na Posição, no Fluxo e no Geral — não mexido aqui (um relatório por vez).
 */
export function useSuppliersFilterOptions(
  planoRef: string,
  costCenterRef: string,
  categoryRef: string,
): SuppliersFilterOptions {
  const pos = usePosicaoFilterOptions(planoRef, costCenterRef, categoryRef)
  const hasPlano = planoRef !== ''
  return {
    programa: useProgramaOptions(),
    plano: pos.plano,
    centro: hasPlano ? pos.centro : EMPTY,
    categoria: hasPlano ? pos.categoria : EMPTY,
    subcategoria: hasPlano ? pos.subcategoria : EMPTY,
  }
}
