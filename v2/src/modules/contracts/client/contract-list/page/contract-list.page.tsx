/**
 * ContractListPage — template/composição (ADR-0009).
 * Liga o binding, resolve i18n, mapeia estado para componentes.
 */
import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { useContractListBinding } from '../contract-list.binding.ts'
import { ContractListTable } from '../components/contract-list-table.component.tsx'
import { ContractListFilters } from '../components/contract-list-filters.component.tsx'
import { ContractListPagination } from '../components/contract-list-pagination.component.tsx'
import { screen } from './contract-list.css.ts'

const t = createTranslator(ptBR)

export function ContractListPage(): ReactNode {
  const { data, isLoading } = useContractListBinding({ page: 1, limit: 20 })

  const contracts = data && isOk(data) ? data.value.items : []
  const meta = data && isOk(data) ? data.value.meta : null

  return (
    <div className={screen}>
      <header>
        <h1>{t('contracts.list.title')}</h1>
        <a href="/contratos/criar">{t('contracts.list.new')}</a>
      </header>
      <ContractListFilters />
      {isLoading ? (
        <p>{t('common.loading')}</p>
      ) : contracts.length === 0 ? (
        <p>{t('contracts.list.empty')}</p>
      ) : (
        <ContractListTable contracts={contracts} />
      )}
      {meta && <ContractListPagination meta={meta} />}
    </div>
  )
}
