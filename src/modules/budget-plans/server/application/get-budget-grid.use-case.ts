/**
 * Use-case: compor a EDIÇÃO DE ORÇAMENTO — a matriz Categorias × 12 MESES de UMA rede (HANDBOOK §1.7).
 *
 * Por que cadeia própria e não um parâmetro no detalhe (§III — uma fn completa por caso de uso):
 *   - o DETALHE agrega TODAS as redes (colunas = redes, valor = anual da rede) → `fillNetworkCells`;
 *   - a EDIÇÃO é de UMA rede (colunas = meses, valor = do mês)                 → `fillMonthlyCells`.
 * São perguntas diferentes ao mesmo dado. Costurar as duas numa fn só faria a tela do detalhe pagar o
 * fan-out da edição (e vice-versa) sem usar o resultado.
 *
 * Orçar é MÊS A MÊS (core-api#413): o anual é a SOMA dos 12, nunca um campo próprio. Ver
 * `budget-plans-mensal-e-cenarios` — é a regra do legado, e a tela é a que o usuário usa pra orçar.
 *
 * ⚠️ ESCOPO (§IX): a tela é endereçada pela REDE (`?estado=CE`), não pelo id do orçamento — então o `budgetId`
 * é RESOLVIDO AQUI, a partir das redes deste plano. Duas consequências, ambas boas: o uuid não circula na URL,
 * e não há como trocar um id na barra de endereço pra ler o orçamento de OUTRO plano (o `by-budget` do core-api
 * resolve por id, não por plano — quem amarra rede↔plano somos nós). Rede fora do plano → 404, que é a resposta
 * honesta: este orçamento não existe NESTE plano.
 *
 * Reusa o port do detalhe (`GetBudgetPlanDetailClient`): as 3 leituras são exatamente as mesmas — o que muda
 * é a composição. Duplicar o port só criaria duas coisas pra manter em sincronia.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type {
  PlanDetailComposed,
  BudgetResultRow,
} from '#modules/budget-plans/server/domain/plan-detail.io.ts'
import {
  mapPlanDetail,
  fillNetworkCells,
  fillMonthlyCells,
  deriveTotalsFromCells,
} from '#modules/budget-plans/server/domain/plan-detail.mapper.ts'
import {
  resolveNetworkNames,
  type GetBudgetPlanDetailDeps,
} from '#modules/budget-plans/server/application/get-budget-plan-detail.use-case.ts'

/** A grade da Edição = o detalhe do plano (cabeçalho + árvore) com os 12 meses de UMA rede + qual é a rede. */
export type BudgetGridComposed = Readonly<{
  detail: PlanDetailComposed
  /** Resolvido a partir de `networkRef` — o client não o conhece (e não precisa). */
  budgetId: string
  /** Rótulo da rede (UF/nome) — o cabeçalho da tela diz QUAL orçamento está sendo editado. */
  networkLabel: string
}>

export const createGetBudgetGrid =
  (deps: GetBudgetPlanDetailDeps) =>
  async (
    planId: string,
    networkRef: string,
    token: string,
  ): Promise<Result<BudgetGridComposed, BudgetPlansError>> => {
    const headerRes = await deps.client.getPlanDetailHeader(planId, token)
    if (isErr(headerRes)) return err(headerRes.error)

    const structureRes = await deps.client.getCostStructure(planId, token)
    if (isErr(structureRes)) return err(structureRes.error) // CORE: falha propaga (não degrada)

    // Mesmo catálogo do detalhe: o título da tela diz "… > Ceará", não "… > CE".
    const networkNames = await resolveNetworkNames(deps.client, token)
    const detail = mapPlanDetail(headerRes.value, structureRes.value, networkNames)

    const network = detail.networks.find((n) => n.ref === networkRef)
    if (network === undefined) return err('budget-plan-not-found') // ver ESCOPO no topo

    // Diferente do detalhe (best-effort por rede), aqui os valores SÃO a tela: se a leitura falhar, propagar.
    // Degradar p/ zeros mostraria uma grade zerada indistinguível de "orçamento ainda não preenchido" — e o
    // usuário salvaria por cima achando que estava vazio (a regra da HONESTIDADE: ausente ≠ zero).
    const rowsRes = await deps.client.getBudgetResults(network.budgetId, token)
    if (isErr(rowsRes)) return err(rowsRes.error)

    // A grade mostra os 12 meses DESTA rede; o cabeçalho, o total do PLANO (todas as redes) — é o mesmo
    // número do Detalhe, e o operador compara os dois. Por isso o fan-out também aqui: sem ele o cabeçalho
    // mostraria só esta rede (ou 0, que é o que o core-api manda — #458).
    const perNetwork = await Promise.all(
      detail.networks.map(async (n): Promise<readonly BudgetResultRow[]> => {
        if (n.budgetId === network.budgetId) return rowsRes.value // já buscado: não pede de novo
        const r = await deps.client.getBudgetResults(n.budgetId, token)
        return isErr(r) ? [] : r.value // best-effort: rede vizinha que falha não derruba ESTA grade
      }),
    )
    const withTotals = deriveTotalsFromCells(fillNetworkCells(detail, perNetwork))

    return ok({
      // A GRADE é só desta rede (`rowsRes`), mas os totais do cabeçalho são do plano inteiro.
      detail: fillMonthlyCells(withTotals, rowsRes.value),
      budgetId: network.budgetId,
      networkLabel: network.name,
    })
  }
