/**
 * Rota /planejamento/detalhes/$id/orcamento — EDIÇÃO de Orçamento por Rede (§1.7). Protegida.
 * `estado`/`municipio` (search) vêm do filtro do Detalhe (botão "Editar"). O `estado` é a `ref` da REDE: o BFF
 * resolve rede→orçamento e devolve a grade com os 12 meses REAIS (`getBudgetGridFn`). LEITURA ligada; a
 * persistência do Salvar segue pendente (core-api #113).
 */
import { createFileRoute } from '@tanstack/react-router'

import { OrcamentoPage } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/orcamento.page.tsx'

type OrcamentoSearch = Readonly<{ estado: string; municipio: string }>

export const Route = createFileRoute('/_authenticated/planejamento_/detalhes/$id_/orcamento')({
  validateSearch: (search: Record<string, unknown>): OrcamentoSearch => ({
    estado: typeof search.estado === 'string' ? search.estado : '',
    municipio: typeof search.municipio === 'string' ? search.municipio : '',
  }),
  component: OrcamentoPage,
})
