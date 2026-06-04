/**
 * ContractFilters — Filtros da listagem de contratos (dumb view).
 */
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { ContractListFilters } from '../contract-list.view-model.ts'
import {
  container,
  fieldLabel,
  input,
  clearButton,
  valueInput,
} from './contract-filters.css.ts'

const _t = createTranslator(ptBR)

function formatDateInput(dateStr: string | undefined): string {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  try {
    const d = new Date(dateStr)
    const yyyy = String(d.getFullYear())
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return ''
  }
}

interface Props {
  filters: ContractListFilters
  onChange: (filters: ContractListFilters) => void
}

export function ContractFilters({ filters, onChange }: Props): ReactNode {
  const handleDateChange =
    (key: 'contractPeriodStart' | 'contractPeriodEnd') =>
    (value: string): void => {
      onChange({ ...filters, [key]: value || undefined })
    }

  const handleNumberChange =
    (key: 'minValue' | 'maxValue') =>
    (value: string): void => {
      const raw = value
      const parsed = raw === '' ? undefined : Number(raw)
      onChange({ ...filters, [key]: parsed })
    }

  const handleClear = (): void => {
    onChange({
      ...filters,
      contractPeriodStart: undefined,
      contractPeriodEnd: undefined,
      minValue: undefined,
      maxValue: undefined,
    })
  }

  return (
    <div className={container}>
      <label className={fieldLabel}>
        {_t('contracts.list.filters.periodStart')}
        <input
          id="filter-period-start"
          type="date"
          className={input}
          value={formatDateInput(filters.contractPeriodStart)}
          onChange={(e) => {
            handleDateChange('contractPeriodStart')(e.target.value)
          }}
        />
      </label>

      <label className={fieldLabel}>
        {_t('contracts.list.filters.periodEnd')}
        <input
          id="filter-period-end"
          type="date"
          className={input}
          value={formatDateInput(filters.contractPeriodEnd)}
          onChange={(e) => {
            handleDateChange('contractPeriodEnd')(e.target.value)
          }}
        />
      </label>

      <label className={fieldLabel}>
        {_t('contracts.list.filters.minValue')}
        <input
          id="filter-min-value"
          type="number"
          min={0}
          step={0.01}
          placeholder="R$ 0,00"
          className={`${input} ${valueInput}`}
          value={String(filters.minValue ?? '')}
          onChange={(e) => {
            handleNumberChange('minValue')(e.target.value)
          }}
        />
      </label>

      <label className={fieldLabel}>
        {_t('contracts.list.filters.maxValue')}
        <input
          id="filter-max-value"
          type="number"
          min={0}
          step={0.01}
          placeholder="R$ 0,00"
          className={`${input} ${valueInput}`}
          value={String(filters.maxValue ?? '')}
          onChange={(e) => {
            handleNumberChange('maxValue')(e.target.value)
          }}
        />
      </label>

      <button type="button" className={clearButton} onClick={handleClear}>
        {_t('contracts.list.filters.clear')}
      </button>
    </div>
  )
}
