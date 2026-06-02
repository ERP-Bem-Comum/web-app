import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const t = createTranslator(ptBR)

export function ContractListFilters(): ReactNode {
  return (
    <div>
      <input type="text" placeholder={t('contracts.list.search')} />
      <select>
        <option value="">{t('contracts.list.filters.all')}</option>
        <option value="expiring">{t('contracts.list.filters.expiring')}</option>
      </select>
    </div>
  )
}
