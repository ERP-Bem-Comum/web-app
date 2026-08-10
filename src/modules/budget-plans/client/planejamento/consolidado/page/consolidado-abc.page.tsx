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

import { ConsolidatedMatrix } from '#modules/budget-plans/client/planejamento/detalhe/components/consolidated-matrix.component.tsx'
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
  const { state, programOptions, prevSemester, nextSemester } = useConsolidadoAbc(search)
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
              {/* §2: com filtro de programa, o legado mostra "Programa PARC: R$ …" sob o total. */}
              {state.header.programSubtotalLabel !== null ? (
                <span className={totalLabel}>{state.header.programSubtotalLabel}</span>
              ) : null}
            </span>
          </div>

          {state.status === 'ready' ? (
            <>
              {/* §2: a matriz "Consolidado dos programas" — Centro × meses (o que o legado mostra). Mesma
                  matriz do Detalhe: a pergunta é idêntica. Sem toggles: aqui não há "Por Rede" (agrega
                  PROGRAMAS) nem gestão de estrutura (read-only). */}
              <ConsolidatedMatrix
                matrix={state.matrix}
                hideViewToggles
                labels={{
                  sectionTitle: t('budget-plans.consolidado.matrixTitle'),
                  centrosHeader: t('budget-plans.consolidado.matrixCentros'),
                  centroCusto: '',
                  porMes: '',
                  porRede: '',
                  prev: t('budget-plans.matrix.prev'),
                  next: t('budget-plans.matrix.next'),
                  total: t('budget-plans.matrix.total'),
                  expand: t('budget-plans.matrix.expand'),
                  collapse: t('budget-plans.matrix.collapse'),
                  edit: '',
                }}
                onPrev={prevSemester}
                onNext={nextSemester}
                onSelectCentroCusto={() => undefined}
                onSelectPorMes={() => undefined}
                onSelectPorRede={() => undefined}
              />
            </>
          ) : (
            <p className={empty}>{t('budget-plans.consolidado.noResults')}</p>
          )}
        </>
      )}
    </div>
  )
}
