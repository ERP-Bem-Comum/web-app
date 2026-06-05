import type { ReactNode } from 'react'

import {
  STATUS_OPTIONS,
  computeStatusChipCounts,
} from '#modules/contracts/client/contract-list/contract-list.view-model.ts'
import type { ContractRow } from '#modules/contracts/client/contract-list/contract-list.view-model.ts'

import {
  badge,
  chipState,
  container,
} from './contract-status-chips.css.ts'

export interface ContractStatusChipsProps {
  readonly contracts: readonly ContractRow[]
  readonly selected: string
  readonly onChange: (status: string) => void
}

export function ContractStatusChips(props: ContractStatusChipsProps): ReactNode {
  const counts = computeStatusChipCounts(props.contracts)

  return (
    <div className={container} role="group" aria-label="Filtro por status">
      {STATUS_OPTIONS.map((option) => {
        const isActive = props.selected === option.key
        const isVencendo = option.key === 'vencendo'
        const stateClass = isVencendo
          ? isActive
            ? chipState.vencendoActive
            : chipState.vencendoInactive
          : isActive
            ? chipState.normalActive
            : chipState.normalInactive

        return (
          <button
            key={option.key}
            type="button"
            className={stateClass}
            onClick={() => {
              props.onChange(option.key)
            }}
            aria-pressed={isActive}
          >
            {option.label}
            <span className={isActive ? badge.active : badge.inactive} aria-hidden="true">
              {counts[option.key] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}
