/**
 * PosicaoRecebimentosPage — tela do relatório "Posição de Recebimentos" (identidade "brand", full-bleed 28px).
 * ESPELHA a "Posição de Pagamentos": wrapper FINO que escolhe a fonte 'r' (Recebimentos → Financiador) via
 * `loadPosicao('r')` e resolve os rótulos i18n do lado de RECEBER; toda a composição vive no `PosicaoReportView`
 * COMPARTILHADO (ZERO duplicação — só a fonte + os rótulos mudam). ADR-0009/0012, §XI.
 *
 * As 3 medidas são NEUTRAS no shape (mesmas chaves de Pagamentos), com semântica de recebíveis:
 *   • Em atraso = não recebido e vencido · Recebido = liquidado · A receber = não recebido e a vencer.
 *
 * ⚠️ Front-first: dados PLACEHOLDER sintéticos (`posicao-recebimentos.placeholder.ts`) só p/ VALIDAR a UI —
 * NÃO há recebível registrado. Quando o Contas a Receber (core-api#114) subir, o placeholder some (fonte
 * retorna `[]`) e a tela cai LIMPA no empty state honesto ("Nenhum recebimento registrado"), já implementado.
 */
import { useMemo, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { loadPosicao, CSV_HEADER_RECEBIMENTOS } from '../posicao.view-model.ts'
import {
  PosicaoReportView,
  type PosicaoReportViewLabels,
} from '../components/posicao-report-view.component.tsx'

const t = createTranslator(ptBR)

export function PosicaoRecebimentosPage(): ReactNode {
  const report = useMemo(() => loadPosicao('r'), [])

  const labels: PosicaoReportViewLabels = {
    back: t('reports.posicao.back'),
    title: t('reports.posicao.rec.title'),
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
      // Rótulo do lado de receber: Financiador (em vez de Fornecedor).
      partner: t('reports.posicao.rec.financiador'),
      filtrar: t('reports.posicao.filters.filtrar'),
    },
    export: {
      label: t('reports.posicao.export.label'),
      csv: t('reports.posicao.export.csv'),
      pdf: t('reports.posicao.export.pdf'),
    },
    kpi: {
      atrasado: t('reports.posicao.kpi.atrasado'),
      pago: t('reports.posicao.rec.recebido'),
      aPagar: t('reports.posicao.rec.aReceber'),
      total: t('reports.posicao.kpi.total'),
      atrasadoSub: t('reports.posicao.rec.kpi.atrasadoSub'),
      pagoSub: t('reports.posicao.rec.kpi.recebidoSub'),
      aPagarSub: t('reports.posicao.rec.kpi.aReceberSub'),
      totalSub: t('reports.posicao.rec.kpi.totalSub'),
    },
    measure: {
      emAtraso: t('reports.posicao.measure.emAtraso'),
      pago: t('reports.posicao.rec.recebido'),
      aPagar: t('reports.posicao.rec.aReceber'),
    },
    chart: {
      resumoTotal: t('reports.posicao.chart.resumoTotal'),
      distribuicao: t('reports.posicao.rec.chart.distribuicao'),
      centerCaption: t('reports.posicao.chart.centerCaption'),
    },
    table: {
      title: t('reports.posicao.rec.table.title'),
      nameCol: t('reports.posicao.rec.columns.name'),
      totalRow: t('reports.posicao.totals.row'),
      expand: t('reports.posicao.tree.expand'),
      collapse: t('reports.posicao.tree.collapse'),
    },
    empty: t('reports.posicao.rec.empty'),
    emptyHint: t('reports.posicao.rec.emptyHint'),
    chartEmptyLabel: t('reports.posicao.empty'),
  }

  return (
    <PosicaoReportView
      report={report}
      labels={labels}
      csvFilename="posicao-recebimentos.csv"
      csvHeader={CSV_HEADER_RECEBIMENTOS}
      chartTone="rec"
    />
  )
}
