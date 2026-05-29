import { STATUS_OPTIONS, deriveStatus, getMostRecentChild } from '../../domain/status'
import type { ContractRow } from '../../domain/types'
import { useMemo } from 'react'

interface Props {
  contracts: ContractRow[]
  selected: string
  onChange: (status: string) => void
}

export function ContractStatusChips({ contracts, selected, onChange }: Props) {
  const counts = useMemo(() => {
    const result: Record<string, number> = {
      todos: 0,
      vigente: 0,
      pendente: 0,
      encerrado: 0,
      distrato: 0,
      vencendo: 0,
    }
    if (!contracts) return result

    result.todos = contracts.length

    const now = new Date()
    const threshold = 45 * 24 * 60 * 60 * 1000

    contracts.forEach((row) => {
      const info = getMostRecentChild(row)
      const derived = deriveStatus(info, !!row.children?.length)
      if (result[derived.key] !== undefined) {
        result[derived.key]++
      }

      if (info?.contractPeriod?.end) {
        const end = new Date(info.contractPeriod.end)
        const diff = end.getTime() - now.getTime()
        if (diff > 0 && diff <= threshold) {
          result.vencendo++
        }
      }
    })
    return result
  }, [contracts])

  return (
    <div className="flex items-center gap-1 p-[2px] rounded-md bg-[#faf7f2] min-w-0 overflow-x-auto">
      {STATUS_OPTIONS.map((opt) => {
        const isActive = selected === opt.key
        const isVencendo = opt.key === 'vencendo'
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            title={isVencendo ? 'Contratos com vigência de 45 dias ou menos' : undefined}
            className={`h-[30px] rounded px-[10px] text-[11px] font-semibold whitespace-nowrap transition-all
              ${isActive
                ? 'bg-white text-[#1f1c1a] shadow-[0_0_0_1px_#e5ded4,0_1px_2px_rgba(0,0,0,0.04)]'
                : 'text-[#736b61] hover:bg-white hover:text-[#1f1c1a] hover:shadow-[0_0_0_1px_#e5ded4,0_1px_2px_rgba(0,0,0,0.04)]'
              }
              ${isVencendo && isActive ? 'bg-[#fff7e0] text-[#9a5402] shadow-[0_0_0_1px_#e5ded4,0_1px_2px_rgba(0,0,0,0.04)]' : ''}
              ${isVencendo && !isActive ? 'hover:bg-[#fff7e0] hover:text-[#9a5402]' : ''}
            `}
          >
            {opt.label}
            <span className={`ml-[6px] font-mono text-[9.5px] font-medium px-[5px] py-[1px] rounded-[3px]
              ${isActive ? 'bg-[#f2ede5] text-[#4d4740]' : 'bg-[#faf7f2] text-[#999187]'}`}>
              {counts[opt.key] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}
