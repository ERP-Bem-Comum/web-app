/**
 * Rota /planejamento/detalhes/$id/orcamento — EDIÇÃO de Orçamento por Rede (§1.7). Protegida.
 * `rede` (search) = a `ref` da rede escolhida no filtro do Detalhe (botão "Editar"): UF no plano de estado,
 * código IBGE no de município. O BFF resolve rede→orçamento e devolve a grade com os 12 meses REAIS
 * (`getBudgetGridFn`); "Calculando Gastos" grava (core-api#413).
 */
import { createFileRoute } from '@tanstack/react-router'

import { OrcamentoPage } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/orcamento.page.tsx'

/** `rede` = `ref` da rede do plano (UF | código IBGE). Era `estado`+`municipio`, que não endereçava a rede. */
type OrcamentoSearch = Readonly<{ rede: string }>

export const Route = createFileRoute('/_authenticated/planejamento_/detalhes/$id_/orcamento')({
  validateSearch: (search: Record<string, unknown>): OrcamentoSearch => ({
    rede: typeof search.rede === 'string' ? search.rede : '',
  }),
  component: OrcamentoPage,
})
