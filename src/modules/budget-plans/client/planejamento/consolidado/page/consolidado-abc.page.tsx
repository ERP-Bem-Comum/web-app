import { useNavigate, getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader, PieChartIcon, FileChartIcon } from '#shared/ui/index.ts'

import {
  useConsolidadoAbc,
  CONSOLIDADO_YEARS,
  CONSOLIDADO_PROGRAM_OPTIONS,
} from '#modules/budget-plans/client/planejamento/consolidado/consolidado-abc.binding.ts'

import { ConsolidatedMatrix } from '../../detalhe/components/consolidated-matrix.component.tsx'
import { ConsolidadoFilters } from '../components/consolidado-filters.component.tsx'
import {
  screen,
  resultCard,
  titleIcon,
  resultHeader,
  resultTitleGroup,
  resultTitleIcon,
  resultTitleText,
  resultTitle,
  totalLine,
  totalLabel,
  totalValue,
  subtotals,
  subtotalItem,
  subtotalProgram,
  empty,
} from './consolidado-abc.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/consolidado')

export function ConsolidadoAbcPage(): ReactNode {
  const search = routeApi.useSearch()
  const navigate = useNavigate()
  const { state, programs, prevSemester, nextSemester } = useConsolidadoAbc(search)

  return (
    <div className={screen}>
      <PageHeader
        title={t('budget-plans.consolidado.title')}
        subtitle={t('budget-plans.consolidado.subtitle')}
        icon={
          <span className={titleIcon}>
            <PieChartIcon size={28} />
          </span>
        }
      />

      <ConsolidadoFilters
        value={{ year: search.year, programs }}
        years={CONSOLIDADO_YEARS}
        programOptions={CONSOLIDADO_PROGRAM_OPTIONS}
        labels={{
          yearBase: t('budget-plans.consolidado.yearBase'),
          programs: t('budget-plans.consolidado.programs'),
          apply: t('budget-plans.consolidado.apply'),
          exportExcel: t('budget-plans.consolidado.exportExcel'),
        }}
        onApply={(v) =>
          void navigate({
            to: '.',
            replace: true,
            search: () => ({
              year: v.year,
              programs: v.programs.length === 0 ? undefined : v.programs.join(','),
            }),
          })
        }
        onExport={() => {
          // TODO(#113): "Exportar Excel/CSV" — o backend gera o arquivo (GET /consolidated-result/csv).
        }}
      />

      <div className={resultCard}>
        <div className={resultHeader}>
          <span className={resultTitleGroup}>
            <span className={resultTitleIcon} aria-hidden="true">
              <FileChartIcon size={20} />
            </span>
            <span className={resultTitleText}>
              <h2 className={resultTitle}>{state.header.title}</h2>
              {state.header.subtotals.length > 0 ? (
                <ul className={subtotals}>
                  {state.header.subtotals.map((s) => (
                    <li key={s.program} className={subtotalItem}>
                      {t('budget-plans.consolidado.programLabel')}{' '}
                      <span className={subtotalProgram}>{s.program}</span>: {s.label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </span>
          </span>
          <span className={totalLine}>
            <span className={totalLabel}>{t('budget-plans.consolidado.total')}</span>
            <span className={totalValue}>{state.header.totalLabel}</span>
          </span>
        </div>
      </div>

      {state.hasResult ? (
        <ConsolidatedMatrix
          matrix={state.matrix}
          labels={{
            sectionTitle: t('budget-plans.consolidado.sectionTitle'),
            centroCusto: t('budget-plans.matrix.centroCusto'),
            porMes: t('budget-plans.matrix.porMes'),
            porRede: t('budget-plans.matrix.porRede'),
            prev: t('budget-plans.matrix.prev'),
            next: t('budget-plans.matrix.next'),
            centrosHeader: t('budget-plans.matrix.centrosHeader'),
            total: t('budget-plans.matrix.total'),
            expand: t('budget-plans.matrix.expand'),
            collapse: t('budget-plans.matrix.collapse'),
            edit: t('budget-plans.detail.edit'),
          }}
          onPrev={prevSemester}
          onNext={nextSemester}
          onSelectCentroCusto={() => {
            // Consolidado ABC é read-only: sem gestão de Centros de Custo (HANDBOOK §2).
          }}
          onSelectPorMes={() => {
            // Consolidado ABC só tem a visão "Por Mês" (não há visão Por Rede aqui).
          }}
          onSelectPorRede={() => {
            // sem visão Por Rede no Consolidado (HANDBOOK §2).
          }}
        />
      ) : (
        <p className={empty}>{t('budget-plans.consolidado.noResults')}</p>
      )}
    </div>
  )
}
