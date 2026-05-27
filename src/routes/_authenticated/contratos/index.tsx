import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getContracts } from '@/server/contracts'
import { contractKeys } from '@/features/contracts/adapters/queries'
import { ContractsTable } from '@/features/contracts/views/components/ContractsTable'
import { ContractFilters } from '@/features/contracts/views/components/ContractFilters'
import { Paginator } from '@/features/contracts/views/components/Paginator'
import { ContractListFiltersSchema } from '@/features/contracts/domain/schemas'
import type { ContractListFilters } from '@/features/contracts/domain/schemas'

export const Route = createFileRoute('/_authenticated/contratos/')({
  validateSearch: ContractListFiltersSchema,
  component: ContractsPage,
})

function ContractsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const { data } = useSuspenseQuery({
    queryKey: contractKeys.list(search),
    queryFn: () => getContracts({ data: search }),
  })

  const handleFilterChange = (filters: ContractListFilters) => {
    navigate({ to: '/contratos', search: filters })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <Link
          to="/contratos/adicionar"
          className="bg-[#32C6F4] hover:bg-[#76D9F8] text-black font-medium py-2 px-4 rounded-md transition-colors"
        >
          + Novo Contrato
        </Link>
      </div>

      <ContractFilters filters={search} onChange={handleFilterChange} />

      <Suspense fallback={<div className="p-4 text-gray-500">Carregando contratos...</div>}>
        <ContractsTable rows={data?.data || []} />
      </Suspense>

      {data?.meta && (
        <Paginator
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          totalItems={data.meta.total}
          onPageChange={(page) => handleFilterChange({ ...search, page })}
        />
      )}
    </div>
  )
}
