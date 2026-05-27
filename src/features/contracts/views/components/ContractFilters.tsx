import { useState, useEffect } from 'react'
import type { ContractListFilters } from '../../domain/schemas'
import { ContractType, ContractStatus } from '../../domain/types'

interface Props {
  filters: ContractListFilters
  onChange: (filters: ContractListFilters) => void
}

export function ContractFilters({ filters, onChange }: Props) {
  const [search, setSearch] = useState(filters.search || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...filters, search: search || undefined, page: 1 })
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Buscar por objeto, código ou fornecedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#32C6F4]"
        />
      </div>

      <select
        value={filters.contractType || ''}
        onChange={(e) =>
          onChange({
            ...filters,
            contractType: (e.target.value as ContractType) || undefined,
            page: 1,
          })
        }
        className="px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#32C6F4]"
      >
        <option value="">Todos os tipos</option>
        <option value={ContractType.SUPPLIER}>Fornecedor</option>
        <option value={ContractType.FINANCIER}>Financiador</option>
        <option value={ContractType.COLLABORATOR}>Colaborador</option>
        <option value={ContractType.ACT}>ACT</option>
      </select>

      <select
        value={filters.contractStatus || ''}
        onChange={(e) =>
          onChange({
            ...filters,
            contractStatus: (e.target.value as ContractStatus) || undefined,
            page: 1,
          })
        }
        className="px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#32C6F4]"
      >
        <option value="">Todos os status</option>
        <option value={ContractStatus.PENDING}>Pendente</option>
        <option value={ContractStatus.SIGNED}>Assinado</option>
        <option value={ContractStatus.ONGOING}>Em andamento</option>
        <option value={ContractStatus.FINISHED}>Finalizado</option>
        <option value={ContractStatus.DISTRATO}>Distrato</option>
      </select>

      <button
        onClick={() => {
          setSearch('')
          onChange({ page: 1, limit: 10, order: 'DESC' })
        }}
        className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Limpar filtros
      </button>
    </div>
  )
}
