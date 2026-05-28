import type { ContractRow } from '../../domain/types'
import ContractRowComponent from './ContractRow'

interface Props {
  rows: ContractRow[]
}

const HEAD_CELLS = [
  { id: 'numero', label: 'NÚMERO', width: 140, align: 'left' as const },
  { id: 'contratado', label: 'CONTRATADO', width: 220, align: 'left' as const },
  { id: 'objeto', label: 'OBJETO', width: 260, align: 'left' as const },
  { id: 'tipo', label: 'TIPO', width: 100, align: 'center' as const },
  { id: 'programa', label: 'PROGRAMA', width: 100, align: 'center' as const },
  { id: 'valor', label: 'VALOR ATUAL', width: 130, align: 'right' as const },
  { id: 'saldo', label: 'SALDO', width: 120, align: 'right' as const },
  { id: 'periodo', label: 'VIGÊNCIA', width: 170, align: 'center' as const },
  { id: 'aditivos', label: 'ADITIVOS', width: 100, align: 'center' as const },
  { id: 'status', label: 'STATUS', width: 120, align: 'center' as const },
  { id: 'actions', label: '', width: 70, align: 'center' as const },
]

export function ContractsTable({ rows }: Props) {
  return (
    <div className="flex-1 w-full min-w-0 overflow-auto max-h-[calc(100vh-270px)] border border-[#e5ded4] rounded-lg bg-white
                    [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
                    [&::-webkit-scrollbar-track]:bg-[#faf7f2] [&::-webkit-scrollbar-track]:rounded
                    [&::-webkit-scrollbar-thumb]:bg-[#b0a89c] [&::-webkit-scrollbar-thumb]:rounded
                    [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-[#faf7f2]
                    [&::-webkit-scrollbar-thumb:hover]:bg-[#999187]">
      <table className="w-full min-w-[1530px]" style={{ tableLayout: 'fixed' }}>
        <thead className="bg-[#faf7f2] text-[#999187] text-[10px] font-extrabold uppercase tracking-[0.05em] leading-[1.2] whitespace-nowrap sticky top-0 z-10">
          <tr>
            {HEAD_CELLS.map((cell) => (
              <th
                key={cell.id}
                className="h-[34px] border-b border-[#e5ded4] px-4"
                style={{ width: cell.width, textAlign: cell.align }}
              >
                {cell.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr className="h-[58px] border-b border-[#f0ede8]">
              <td colSpan={11} className="px-4 text-center text-[#999187] text-sm">
                Nenhum contrato encontrado
              </td>
            </tr>
          )}
          {rows.map((row, index) => (
            <ContractRowComponent key={String(row.id)} row={row} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
