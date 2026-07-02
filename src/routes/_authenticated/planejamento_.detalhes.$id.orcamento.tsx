/**
 * Rota /planejamento/detalhes/$id/orcamento — EDIÇÃO de Orçamento por Rede (US2.4). Protegida.
 * `estado`/`municipio` (search) vêm do filtro do Detalhe (botão "Editar"). Front-first: placeholder
 * até `GET /budget-plans/:id` + persistência existirem (core-api #113).
 */
import { createFileRoute } from '@tanstack/react-router'

import { OrcamentoPage } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/orcamento.page.tsx'

type OrcamentoSearch = Readonly<{ estado: string; municipio: string }>

export const Route = createFileRoute('/_authenticated/planejamento_/detalhes/$id/orcamento')({
  validateSearch: (search: Record<string, unknown>): OrcamentoSearch => ({
    estado: typeof search.estado === 'string' ? search.estado : '',
    municipio: typeof search.municipio === 'string' ? search.municipio : '',
  }),
  component: OrcamentoPage,
})
