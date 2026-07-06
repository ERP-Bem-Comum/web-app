/**
 * SuppliersWithoutContractPage — tela do relatório "Fornecedores sem Contrato" (identidade "brand",
 * full-bleed 28px, padrão do grid de Colaboradores). Front-first: os dados vêm de constantes placeholder
 * (core-api#114 ainda não existe). A ÚNICA lógica local é UI-state: o input **Limite** (dirige a matemática)
 * — o resto é derivação PURA via ViewModel. O CSV é montado pela ViewModel e baixado via Blob (client-side);
 * o PDF usa window.print(). View burra: sem cálculo aqui.
 */
import { useMemo, useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { screen, header, headText, headTitle, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'

import {
  loadSupplierRows,
  buildCsv,
  parseLimiteToCents,
  formatLimiteInput,
  LIMITE_DEFAULT_CENTS,
} from '../suppliers-without-contract.view-model.ts'
import { ReportFilters } from '../components/report-filters.component.tsx'
import { exportTrigger } from '../components/report-filters.css.ts'
import { ReportExportDropdown } from '../components/report-export-dropdown.component.tsx'
import { SupplierTreeTable } from '../components/supplier-tree-table.component.tsx'

const t = createTranslator(ptBR)

/** Baixa o CSV via Blob + anchor (client-side; o backend entregará JSON depois). */
function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function SuppliersWithoutContractPage(): ReactNode {
  // UI-state: o texto do input Limite. Inicia no padrão R$ 10.000,00 → "10.000,00".
  const [limiteText, setLimiteText] = useState(() => formatLimiteInput(LIMITE_DEFAULT_CENTS))

  const limiteCents = parseLimiteToCents(limiteText)
  const rows = useMemo(() => loadSupplierRows(limiteCents), [limiteCents])

  return (
    <div className={screen}>
      <div className={header}>
        <div className={headText}>
          <h1 className={headTitle}>{t('reports.suppliersWithoutContract.title')}</h1>
          <p className={headSubtitle}>{t('reports.suppliersWithoutContract.subtitle')}</p>
        </div>
      </div>

      <ReportFilters
        limiteValue={limiteText}
        onLimiteChange={setLimiteText}
        labels={{
          advancedTitle: t('reports.suppliersWithoutContract.filters.title'),
          advancedSubtitle: t('reports.suppliersWithoutContract.filters.subtitle'),
          programa: t('reports.suppliersWithoutContract.filters.programa'),
          plano: t('reports.suppliersWithoutContract.filters.plano'),
          periodo: t('reports.suppliersWithoutContract.filters.periodo'),
          limite: t('reports.suppliersWithoutContract.filters.limite'),
          centro: t('reports.suppliersWithoutContract.filters.centro'),
          categoria: t('reports.suppliersWithoutContract.filters.categoria'),
          subcategoria: t('reports.suppliersWithoutContract.filters.subcategoria'),
          allOption: t('reports.suppliersWithoutContract.filters.allOption'),
          filtrar: t('reports.suppliersWithoutContract.filters.filtrar'),
        }}
        exportSlot={
          <ReportExportDropdown
            triggerClassName={exportTrigger}
            exportLabel={t('reports.suppliersWithoutContract.export.label')}
            csvLabel={t('reports.suppliersWithoutContract.export.csv')}
            pdfLabel={t('reports.suppliersWithoutContract.export.pdf')}
            onExportCsv={() => {
              downloadCsv('fornecedores-sem-contrato.csv', buildCsv(rows))
            }}
          />
        }
      />

      <SupplierTreeTable
        rows={rows}
        labels={{
          supplier: t('reports.suppliersWithoutContract.columns.supplier'),
          valorTotal: t('reports.suppliersWithoutContract.columns.valorTotal'),
          utilizado: t('reports.suppliersWithoutContract.columns.utilizado'),
          restante: t('reports.suppliersWithoutContract.columns.restante'),
          expand: t('reports.suppliersWithoutContract.tree.expand'),
          collapse: t('reports.suppliersWithoutContract.tree.collapse'),
          empty: t('reports.suppliersWithoutContract.empty'),
        }}
      />
    </div>
  )
}
