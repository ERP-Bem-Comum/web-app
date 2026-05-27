import { Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteContract } from '@/server/contracts.server'
import type { ContractRow } from '../../domain/types'
import { contractKeys } from '../../adapters/queries'

interface Props {
  rows: ContractRow[]
}

export function ContractsTable({ rows }: Props) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-700 uppercase">
          <tr>
            <th className="px-4 py-3 text-left">Código</th>
            <th className="px-4 py-3 text-left">Objeto</th>
            <th className="px-4 py-3 text-left">Tipo</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Valor</th>
            <th className="px-4 py-3 text-left">Período</th>
            <th className="px-4 py-3 text-left">Fornecedor</th>
            <th className="px-4 py-3 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{row.contractCode}</td>
              <td className="px-4 py-3 max-w-[200px] truncate">{row.object}</td>
              <td className="px-4 py-3">{row.contractType}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.contractStatus} />
              </td>
              <td className="px-4 py-3">
                {row.totalValue?.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {row.contractPeriod?.start
                  ? new Date(row.contractPeriod.start).toLocaleDateString('pt-BR')
                  : '-'}
                {' → '}
                {row.contractPeriod?.end
                  ? new Date(row.contractPeriod.end).toLocaleDateString('pt-BR')
                  : '-'}
              </td>
              <td className="px-4 py-3">{row.supplier?.name || '-'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link
                    to="/contratos/detalhes/$id"
                    params={{ id: String(row.id) }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver
                  </Link>
                  <Link
                    to="/contratos/editar/$id"
                    params={{ id: String(row.id) }}
                    className="text-green-600 hover:text-green-800 font-medium"
                  >
                    Editar
                  </Link>
                  <DeleteButton id={row.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pendente: 'bg-yellow-100 text-yellow-800',
    Assinado: 'bg-blue-100 text-blue-800',
    'Em andamento': 'bg-green-100 text-green-800',
    Finalizado: 'bg-gray-100 text-gray-800',
    Distrato: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  )
}

function DeleteButton({ id }: { id: number }) {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteContract({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.lists() })
    },
  })

  const handleClick = () => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      mutation.mutate()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending}
      className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
    >
      {mutation.isPending ? 'Excluindo...' : 'Excluir'}
    </button>
  )
}
