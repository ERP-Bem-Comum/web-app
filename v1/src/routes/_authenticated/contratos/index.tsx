import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Suspense, useState, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getContracts } from '@/server/contracts'
import { contractKeys } from '@/features/contracts/adapters/queries'
import { ContractsTable } from '@/features/contracts/views/components/ContractsTable'
import { ContractFilters } from '@/features/contracts/views/components/ContractFilters'
import { ContractPaginator } from '@/features/contracts/views/components/ContractPaginator'
import { ContractStatusChips } from '@/features/contracts/views/components/ContractStatusChips'
import { ContractListFiltersSchema } from '@/features/contracts/domain/schemas'
import type { ContractListFilters } from '@/features/contracts/domain/schemas'
import { deriveStatus, getMostRecentChild } from '@/features/contracts/domain/status'
import type { ContractRow } from '@/features/contracts/domain/types'
import { Plus, Search, Filter } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/contratos/')({
  validateSearch: ContractListFiltersSchema,
  component: ContractsPage,
})

function filterByDerivedStatus(rows: ContractRow[], statusKey: string): ContractRow[] {
  if (statusKey === 'todos') return rows
  if (statusKey === 'vencendo') {
    const now = new Date()
    const threshold = 45 * 24 * 60 * 60 * 1000
    return rows.filter((row) => {
      const info = getMostRecentChild(row)
      if (!info?.contractPeriod?.end) return false
      const end = new Date(info.contractPeriod.end)
      const diff = end.getTime() - now.getTime()
      return diff > 0 && diff <= threshold
    })
  }
  return rows.filter((row) => {
    const info = getMostRecentChild(row)
    const derived = deriveStatus(info, !!row.children?.length)
    return derived.key === statusKey
  })
}

function ContractsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('todos')
  const [showFilters, setShowFilters] = useState(false)

  const { data } = useSuspenseQuery({
    queryKey: contractKeys.list(search),
    queryFn: () => getContracts({ data: search }),
  })

  const rawRows: ContractRow[] = data?.data || []

  const filteredRows = useMemo(() => {
    return filterByDerivedStatus(rawRows, statusFilter)
  }, [rawRows, statusFilter])

  const handleFilterChange = (filters: ContractListFilters) => {
    navigate({ to: '/contratos', search: filters })
  }

  const handleItemsPerPageChange = (limit: number) => {
    navigate({ to: '/contratos', search: { ...search, limit, page: 1 } })
  }

  return (
    <div className="flex flex-col flex-1 w-full min-w-0 h-full overflow-hidden pb-[72px]">
      {/* Header institucional */}
      <div className="flex items-center gap-[14px] min-h-[56px] px-4 py-[10px] border-b border-[#e5ded4] bg-white min-w-0">
        <div className="flex items-center gap-[10px] min-w-0 flex-1">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-md border transition-all shrink-0
              ${showFilters
                ? 'border-[#8bb0d6] bg-[#e8eef5] text-[#2d4f75]'
                : 'border-[#e5ded4] bg-white text-[#736b61] hover:bg-[#faf7f2] hover:border-[#c7bfb2]'
              }`}
            title="Mostrar/ocultar filtros"
          >
            <Filter size={15} />
          </button>

          <div className="relative w-full max-w-[430px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#396496]" />
            <input
              type="text"
              placeholder="Buscar por contratado, número, CNPJ/CPF"
              value={search.search || ''}
              onChange={(e) => handleFilterChange({ ...search, search: e.target.value, page: 1 })}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-[#e5ded4] bg-white text-[12.5px] text-[#332e29] placeholder:text-[#999187] outline-none focus:border-[#8bb0d6] transition-colors"
            />
          </div>
        </div>

        <ContractStatusChips
          contracts={rawRows}
          selected={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Filtros avançados — ocultos por padrão */}
      {showFilters && (
        <ContractFilters filters={search} onChange={handleFilterChange} />
      )}

      {/* Tabela */}
      <div className="flex-1 px-4 py-3 min-w-0 overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-[#32C6F4] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ContractsTable rows={filteredRows} />
        </Suspense>
      </div>

      {/* Bottombar fixo */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center gap-[14px] px-6 min-h-[56px] bg-[rgba(245,243,240,0.98)] backdrop-blur-[12px] border-t border-[#e5ded4] z-[100] shadow-[0_-2px_12px_rgba(31,28,26,0.06)]">
        <ContractPaginator
          page={data?.meta?.page ?? 1}
          totalPages={data?.meta?.totalPages ?? 1}
          totalItems={data?.meta?.total ?? 0}
          itemsPerPage={search.limit}
          onPageChange={(page) => handleFilterChange({ ...search, page })}
          onItemsPerPageChange={handleItemsPerPageChange}
        />

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/contratos/adicionar"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[11.5px] font-semibold bg-[#396496] text-white hover:bg-[#2d4f75] transition-all hover:shadow-[0_4px_10px_rgba(57,100,150,0.25)]"
          >
            <Plus size={14} />
            Novo Contrato
          </Link>
        </div>
      </div>
    </div>
  )
}
