import type { ContractListFilters } from '../../domain/schemas'

interface Props {
  filters: ContractListFilters
  onChange: (filters: ContractListFilters) => void
}

function formatDateInput(dateStr: string | undefined): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return ''
  }
}

export function ContractFilters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b border-[#e5ded4] bg-[#faf7f2]">
      {/* Período de Vigência — Data Início */}
      <div className="flex flex-col gap-1">
        <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">
          Vigência de
        </label>
        <input
          type="date"
          autoComplete="off"
          placeholder=" "
          value={formatDateInput(filters.contractPeriodStart)}
          onChange={(e) =>
            onChange({
              ...filters,
              contractPeriodStart: e.target.value || undefined,
              page: 1,
            })
          }
          className="h-8 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors [color-scheme:light]"
        />
      </div>

      {/* Período de Vigência — Data Fim */}
      <div className="flex flex-col gap-1">
        <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">
          até
        </label>
        <input
          type="date"
          autoComplete="off"
          placeholder=" "
          value={formatDateInput(filters.contractPeriodEnd)}
          onChange={(e) =>
            onChange({
              ...filters,
              contractPeriodEnd: e.target.value || undefined,
              page: 1,
            })
          }
          className="h-8 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors [color-scheme:light]"
        />
      </div>

      {/* Valor Mínimo */}
      <div className="flex flex-col gap-1">
        <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">
          Valor mín.
        </label>
        <input
          type="number"
          min={0}
          step={0.01}
          placeholder="R$ 0,00"
          value={filters.minValue ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              minValue: e.target.value ? Number(e.target.value) : undefined,
              page: 1,
            })
          }
          className="h-8 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors w-[130px]"
        />
      </div>

      {/* Valor Máximo */}
      <div className="flex flex-col gap-1">
        <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">
          Valor máx.
        </label>
        <input
          type="number"
          min={0}
          step={0.01}
          placeholder="R$ 0,00"
          value={filters.maxValue ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              maxValue: e.target.value ? Number(e.target.value) : undefined,
              page: 1,
            })
          }
          className="h-8 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors w-[130px]"
        />
      </div>

      {/* Limpar filtros */}
      <button
        onClick={() => {
          onChange({ page: 1, limit: filters.limit || 10, order: 'DESC' })
        }}
        className="h-8 px-3 text-[12px] font-medium rounded-md border border-[#e5ded4] bg-white text-[#736b61] hover:bg-[#faf7f2] hover:border-[#c7bfb2] transition-colors ml-auto"
      >
        Limpar filtros
      </button>
    </div>
  )
}
