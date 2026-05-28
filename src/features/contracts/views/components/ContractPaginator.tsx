interface Props {
  page: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (limit: number) => void
}

const LIMIT_OPTIONS = [5, 10, 12, 25, 50]

export function ContractPaginator({
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: Props) {
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(page * itemsPerPage, totalItems)

  return (
    <div className="flex items-center gap-3 text-[11.5px] text-[#736b61]">
      <span className="font-mono text-[11px] font-medium text-[#332e29]">
        {rangeStart}–{rangeEnd} de {totalItems}
      </span>

      <span className="text-[#c7bfb2]">·</span>

      {onItemsPerPageChange && (
        <div className="flex items-center gap-1.5">
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="h-[26px] px-1.5 text-[11px] font-mono rounded border border-[#e5ded4] bg-white text-[#332e29] outline-none focus:border-[#8bb0d6] cursor-pointer"
          >
            {LIMIT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-[#999187]">por página</span>
        </div>
      )}

      <div className="flex items-center gap-0.5 ml-2 pl-3 border-l border-[#e5ded4]">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-[#736b61] hover:bg-[#faf7f2] disabled:text-[#c7bfb2] disabled:cursor-not-allowed transition-colors"
          title="Página anterior"
        >
          ‹
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-[#736b61] hover:bg-[#faf7f2] disabled:text-[#c7bfb2] disabled:cursor-not-allowed transition-colors"
          title="Próxima página"
        >
          ›
        </button>
      </div>
    </div>
  )
}
