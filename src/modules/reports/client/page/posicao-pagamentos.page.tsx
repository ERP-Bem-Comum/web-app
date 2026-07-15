/**
 * PosicaoPagamentosPage — tela do relatório "Posição de Pagamentos" (identidade "brand", full-bleed 28px).
 * Wrapper FINO: escolhe a fonte 'p' (Pagamentos → Fornecedor) via `loadPosicao('p')` e resolve os rótulos
 * i18n; toda a composição (cabeçalho → filtros → 4 KPIs → 2 gráficos → tabela) vive no `PosicaoReportView`
 * COMPARTILHADO com a "Posição de Recebimentos" (ZERO duplicação — só a fonte + os rótulos mudam).
 *
 * As 3 medidas são DERIVADAS do estado real do Contas a Pagar (Em atraso = não pago e vencido; Pago =
 * liquidado; A pagar = não pago e a vencer); o Total é a soma. Front-first: dados placeholder SINTÉTICOS
 * (ver `posicao-pagamentos.placeholder.ts`) até o endpoint do core-api (#114) existir.
 */
import { type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { CSV_HEADER } from '../posicao.view-model.ts'
import { usePosicaoPagamentos } from '../posicao.binding.ts'
import {
  PosicaoReportView,
  type PosicaoReportViewLabels,
} from '../components/posicao-report-view.component.tsx'
import { ReportStatePanel } from '../components/report-state-panel.component.tsx'

const t = createTranslator(ptBR)

export function PosicaoPagamentosPage(): ReactNode {
  // Server-state REAL do core-api (#114): loading | error | ready. O empty-state honesto (dado real vazio) é
  // resolvido DENTRO da PosicaoReportView a partir do `report` (0 nós / total 0) — a Posição de Recebimentos
  // (placeholder → `[]`) continua caindo lá também.
  const state = usePosicaoPagamentos()

  if (state.status === 'loading') {
    return <ReportStatePanel title={t('reports.posicao.loading')} />
  }
  if (state.status === 'error') {
    return <ReportStatePanel role="alert" title={t('reports.posicao.errorTitle')} hint={t(state.errorTag)} />
  }

  const labels: PosicaoReportViewLabels = {
    back: t('reports.posicao.back'),
    title: t('reports.posicao.title'),
    filters: {
      title: t('reports.posicao.filters.title'),
      allOption: t('reports.posicao.filters.allOption'),
      plano: t('reports.posicao.filters.plano'),
      periodo: t('reports.posicao.filters.periodo'),
      conta: t('reports.posicao.filters.conta'),
      status: t('reports.posicao.filters.status'),
      centro: t('reports.posicao.filters.centro'),
      categoria: t('reports.posicao.filters.categoria'),
      subcategoria: t('reports.posicao.filters.subcategoria'),
      partner: t('reports.posicao.filters.fornecedor'),
      filtrar: t('reports.posicao.filters.filtrar'),
    },
    export: {
      label: t('reports.posicao.export.label'),
      csv: t('reports.posicao.export.csv'),
      pdf: t('reports.posicao.export.pdf'),
    },
    kpi: {
      atrasado: t('reports.posicao.kpi.atrasado'),
      pago: t('reports.posicao.kpi.pago'),
      aPagar: t('reports.posicao.kpi.aPagar'),
      total: t('reports.posicao.kpi.total'),
      atrasadoSub: t('reports.posicao.kpi.atrasadoSub'),
      pagoSub: t('reports.posicao.kpi.pagoSub'),
      aPagarSub: t('reports.posicao.kpi.aPagarSub'),
      totalSub: t('reports.posicao.kpi.totalSub'),
    },
    measure: {
      emAtraso: t('reports.posicao.measure.emAtraso'),
      pago: t('reports.posicao.measure.pago'),
      aPagar: t('reports.posicao.measure.aPagar'),
    },
    chart: {
      resumoTotal: t('reports.posicao.chart.resumoTotal'),
      distribuicao: t('reports.posicao.chart.distribuicaoFornecedor'),
      centerCaption: t('reports.posicao.chart.centerCaption'),
    },
    table: {
      title: t('reports.posicao.table.title'),
      nameCol: t('reports.posicao.columns.name'),
      totalRow: t('reports.posicao.totals.row'),
      expand: t('reports.posicao.tree.expand'),
      collapse: t('reports.posicao.tree.collapse'),
    },
    empty: t('reports.posicao.empty'),
    emptyHint: t('reports.posicao.empty'),
    chartEmptyLabel: t('reports.posicao.empty'),
  }

  return (
    <PosicaoReportView
      report={state.report}
      labels={labels}
      csvFilename="posicao-pagamentos.csv"
      csvHeader={CSV_HEADER}
    />
  )
}
