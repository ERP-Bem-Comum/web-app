import { IPaginationMeta } from '@/types/global'
import { useEffect, useState, useCallback } from 'react'
import { FieldValues, Path, UseFormSetValue } from 'react-hook-form'

interface PropsPaginator<T extends FieldValues> {
  children?: React.ReactNode
  setValue?: UseFormSetValue<T>
  meta?: IPaginationMeta | null
  filteredCount?: number
}

export const Paginator = <T extends FieldValues>({
  children,
  setValue,
  meta,
  filteredCount,
}: PropsPaginator<T>) => {
  const [page, setPage] = useState(1)
  const [qntPage, setQntPage] = useState(1)
  const [limit, setLimit] = useState(12)
  const [disablePrev, setDisablePrev] = useState(false)
  const [disableNext, setDisableNext] = useState(false)

  const handleSetValue = useCallback(
    (field: string, value: any) => {
      if (setValue) {
        setValue(field as Path<T>, value)
      }
    },
    [setValue],
  )

  useEffect(() => {
    if (meta?.totalPages) {
      setQntPage(meta.totalPages)
      setPage(meta.currentPage)
    }
  }, [meta])

  /* ═══════════════════════════════════════
     Quando filteredCount muda (ex: filtro
     de status reduz os itens), volta para
     página 1 se a página atual ficar vazia.
     ═══════════════════════════════════════ */
  useEffect(() => {
    if (filteredCount !== undefined) {
      const maxPage = Math.max(1, Math.ceil(filteredCount / limit))
      if (page > maxPage) {
        setPage(1)
        handleSetValue('paginationParams.page', 1)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCount, limit])

  useEffect(() => {
    setDisablePrev(page === 1)
    setDisableNext(page === qntPage)
  }, [page, qntPage])

  const handlePrevPage = useCallback(() => {
    if (page > 1) {
      const newPage = page - 1
      setPage(newPage)
      handleSetValue('paginationParams.page', newPage)
    }
  }, [page, handleSetValue])

  const handleNextPage = useCallback(() => {
    if (page < qntPage) {
      const newPage = page + 1
      setPage(newPage)
      handleSetValue('paginationParams.page', newPage)
    }
  }, [page, qntPage, handleSetValue])

  const handleChangeLimit = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newLimit = parseInt(event.target.value)
      setLimit(newLimit)
      setPage(1)
      handleSetValue('paginationParams.limit', newLimit)
      handleSetValue('paginationParams.page', 1)
    },
    [handleSetValue],
  )

  const totalItems = meta?.totalItems ?? 0
  const showing = filteredCount !== undefined ? filteredCount : totalItems
  const effectiveTotal = filteredCount !== undefined ? filteredCount : totalItems

  /* range nunca pode começar depois de terminar */
  const rangeStart = effectiveTotal === 0 ? 0 : Math.min((page - 1) * limit + 1, effectiveTotal)
  const rangeEnd = Math.min(page * limit, effectiveTotal)

  return (
    <div className="flex items-center gap-3 text-[11.5px] text-[#736b61]">
      <span className="font-mono text-[11px] font-medium text-[#332e29]">
        {showing === 0 ? '0' : `${rangeStart}–${rangeEnd}`} de {showing}
      </span>
      <span>·</span>
      <div className="flex items-center gap-1.5">
        <span>{limit} por página</span>
        <select
          value={limit}
          onChange={handleChangeLimit}
          className="bg-transparent border border-[#e5ded4] rounded px-1.5 py-0.5 text-[11px] font-mono cursor-pointer outline-none focus:border-[#396496]"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={12}>12</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>
      <div className="flex items-center gap-0.5 ml-2 pl-3 border-l border-[#e5ded4]">
        <button
          onClick={handlePrevPage}
          disabled={disablePrev}
          className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-[13px] text-[#736b61] transition-all hover:bg-[#faf7f2] hover:text-[#332e29] disabled:text-[#c7bfb2] disabled:cursor-not-allowed"
          title="Página anterior"
        >
          ‹
        </button>
        <button
          onClick={handleNextPage}
          disabled={disableNext}
          className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-[13px] text-[#736b61] transition-all hover:bg-[#faf7f2] hover:text-[#332e29] disabled:text-[#c7bfb2] disabled:cursor-not-allowed"
          title="Próxima página"
        >
          ›
        </button>
      </div>
      {children}
    </div>
  )
}
