import { useNavigate, getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PieChartIcon, FileTextIcon } from '#shared/ui/index.ts'
import { headText, headTitle, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'

import {
  useConsolidadoAbc,
  CONSOLIDADO_YEARS,
} from '#modules/budget-plans/client/planejamento/consolidado/consolidado-abc.binding.ts'
import { useConsolidadoExport } from '#modules/budget-plans/client/planejamento/consolidado/consolidado-export.binding.ts'

import { ConsolidadoCurve } from '../components/consolidado-curve.component.tsx'
import { ConsolidadoFilters } from '../components/consolidado-filters.component.tsx'
import {
  screen,
  pageHead,
  pageIcon,
  resultCard,
  resultTitleIcon,
  resultTitleText,
  resultTitle,
  totalLine,
  totalLabel,
  totalValue,
  empty,
} from './consolidado-abc.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/consolidado')

export function ConsolidadoAbcPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state, programOptions } = useConsolidadoAbc(search)
  const csvExport = useConsolidadoExport({ year: search.year, programRef: search.programRef })

  return (
    <div className={screen}>
      <div className={pageHead}>
        <span className={pageIcon} aria-hidden="true">
          <PieChartIcon size={24} />
        </span>
        <div className={headText}>
          <h1 className={headTitle}>{t('budget-plans.consolidado.title')}</h1>
          <p className={headSubtitle}>{t('budget-plans.consolidado.subtitle')}</p>
        </div>
      </div>

      <ConsolidadoFilters
        value={{ year: search.year, programRef: search.programRef }}
        years={CONSOLIDADO_YEARS}
        programOptions={programOptions}
        labels={{
          yearBase: t('budget-plans.consolidado.yearBase'),
          programs: t('budget-plans.consolidado.programs'),
          apply: t('budget-plans.consolidado.apply'),
          exportCsv: t('budget-plans.consolidado.exportCsv'),
        }}
        exporting={csvExport.exporting}
        onApply={(v) =>
          void navigate({
            to: '.',
            replace: true,
            search: () => ({ year: v.year, programRef: v.programRef }),
          })
        }
        onExport={csvExport.exportCsv}
      />
      {csvExport.errorTag !== null ? (
        <p className={empty} role="alert">
          {t(csvExport.errorTag)}
        </p>
      ) : null}

      {state.status === 'loading' ? (
        <p className={empty}>{t('budget-plans.consolidado.loading')}</p>
      ) : state.status === 'error' ? (
        <p className={empty} role="alert">
          {t('budget-plans.consolidado.error')}
        </p>
      ) : (
        <>
          <div className={resultCard}>
            <span className={resultTitleIcon} aria-hidden="true">
              <FileTextIcon size={22} />
            </span>
            <span className={resultTitleText}>
              <h2 className={resultTitle}>{state.header.title}</h2>
            </span>
            <span className={totalLine}>
              <span className={totalLabel}>{t('budget-plans.consolidado.total')}</span>
              <span className={totalValue}>{state.header.totalLabel}</span>
            </span>
          </div>

          {state.status === 'ready' ? (
            <ConsolidadoCurve
              rows={state.rows}
              labels={{
                title: t('budget-plans.consolidado.curveTitle'),
                colProgram: t('budget-plans.consolidado.colProgram'),
                colTotal: t('budget-plans.consolidado.colTotal'),
                colShare: t('budget-plans.consolidado.colShare'),
              }}
            />
          ) : (
            <p className={empty}>{t('budget-plans.consolidado.noResults')}</p>
          )}
        </>
      )}
    </div>
  )
}
