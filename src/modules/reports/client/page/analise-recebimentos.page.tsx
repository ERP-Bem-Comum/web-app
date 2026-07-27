/**
 * AnaliseRecebimentosPage — tela do relatório "Análise de Recebimentos" (identidade "brand", full-bleed 28px).
 * ESPELHA a "Análise de Pagamentos": wrapper FINO que escolhe a fonte 'r' (Recebimentos) via `loadAnalise('r')`
 * e resolve os rótulos i18n do lado de RECEBER; toda a composição vive no `AnaliseReportView` COMPARTILHADO
 * (ZERO duplicação — só a fonte, os rótulos e o TOM dos gráficos mudam). ADR-0009/0012, §XI.
 *
 * Mesma matriz TEMPO-orçamentária (Plano Orçamentário → Centro de Custo × série MENSAL), agora de RECEBÍVEIS.
 * Os 2 gráficos usam `chartTone='rec'` (paleta DISTINTA da de Pagamentos — verde-azulado + roxo).
 *
 * ⚠️ Front-first: dados PLACEHOLDER sintéticos (`analise-recebimentos.placeholder.ts`) só p/ VALIDAR a UI —
 * NÃO há recebível registrado. Quando o Contas a Receber (core-api#114) subir, o placeholder some (fonte
 * retorna `[]`) e a tela cai LIMPA no empty state honesto ("Nenhum recebimento registrado"), já implementado.
 */
import { useMemo, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { loadAnalise } from '../analise.view-model.ts'
import {
  AnaliseReportView,
  type AnaliseReportViewLabels,
} from '../components/analise-report-view.component.tsx'

const t = createTranslator(ptBR)

export function AnaliseRecebimentosPage(): ReactNode {
  const report = useMemo(() => loadAnalise('r'), [])

  const labels: AnaliseReportViewLabels = {
    back: t('reports.analise.back'),
    title: t('reports.analise.rec.title'),
    filters: {
      title: t('reports.analise.filters.title'),
      allOption: t('reports.analise.filters.allOption'),
      programa: t('reports.analise.filters.programa'),
      plano: t('reports.analise.filters.plano'),
      // Do lado de receber, o período é de PREVISÃO de recebimento.
      periodo: t('reports.analise.rec.filters.periodo'),
      periodoDe: t('reports.analise.filters.periodoDe'),
      periodoAte: t('reports.analise.filters.periodoAte'),
      conta: t('reports.analise.filters.conta'),
      status: t('reports.analise.filters.status'),
      centro: t('reports.analise.filters.centro'),
      categoria: t('reports.analise.filters.categoria'),
      subcategoria: t('reports.analise.filters.subcategoria'),
      filtrar: t('reports.analise.filters.filtrar'),
      // Status alinhados ao Contas a Pagar (reusa os mesmos rótulos de chip, como na Análise de Pagamentos).
      statusChips: [
        t('financial.list.chip.rascunho'),
        t('financial.list.chip.aberto'),
        t('financial.list.chip.aprovado'),
        t('financial.list.chip.pago'),
        t('financial.list.chip.conciliado'),
      ],
    },
    export: {
      label: t('reports.analise.export.label'),
      csv: t('reports.analise.export.csv'),
      pdf: t('reports.analise.export.pdf'),
    },
    charts: {
      byCostCenter: t('reports.analise.charts.byCostCenter'),
      monthly: t('reports.analise.charts.monthly'),
    },
    chartEmptyLabel: t('reports.analise.empty'),
    table: {
      cardTitle: t('reports.analise.table.title'),
      nameCol: t('reports.analise.columns.name'),
      totalCol: t('reports.analise.columns.total'),
      totalRow: t('reports.analise.totals.row'),
      expand: t('reports.analise.tree.expand'),
      collapse: t('reports.analise.tree.collapse'),
      prevMonths: t('reports.analise.pager.prev'),
      nextMonths: t('reports.analise.pager.next'),
    },
    empty: t('reports.analise.rec.empty'),
    emptyHint: t('reports.analise.rec.emptyHint'),
  }

  return (
    <AnaliseReportView
      report={report}
      labels={labels}
      csvFilename="analise-recebimentos.csv"
      chartTone="rec"
    />
  )
}
