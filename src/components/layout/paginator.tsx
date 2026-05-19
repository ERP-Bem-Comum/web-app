import { IPaginationMeta } from '@/types/global'
import { useEffect, useState, useCallback } from 'react'
import { FieldValues, Path, UseFormSetValue } from 'react-hook-form'
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md'

interface PropsPaginator<T extends FieldValues> {
  children: React.ReactNode
  setValue?: UseFormSetValue<T>
  meta?: IPaginationMeta | null
}

export const Paginator = <T extends FieldValues>({
  children,
  setValue,
  meta,
}: PropsPaginator<T>) => {
  const [page, setPage] = useState(1)
  const [qntPage, setQntPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [disablePrev, setDisablePrev] = useState(false)
  const [disableNext, setDisableNext] = useState(false)

  // Use useCallback to memoize this function
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

  useEffect(() => {
    setDisablePrev(page === 1)
    setDisableNext(page === qntPage)
  }, [page, qntPage])

  // Use useCallback for all handlers
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

  return (
    <div>
      {children}
      <div className="flex justify-end items-center text-sm bg-[#F5F5F5] py-4 px-3 text-[#248DAD] flex-wrap">
        Itens por página:
        <select value={limit} onChange={handleChangeLimit}>
          <option value={5} key={5}>
            5
          </option>
          <option value={10} key={10}>
            10
          </option>
          <option value={25} key={25}>
            25
          </option>
        </select>
        <p
          style={{
            marginLeft: '25px',
          }}
        ></p>
        {page} - {qntPage}
        <p
          style={{
            marginRight: '25px',
          }}
        ></p>
        <button onClick={handlePrevPage} disabled={disablePrev} className="disabled:text-[#A1E5FA]">
          <MdNavigateBefore size={24} />
        </button>
        <button onClick={handleNextPage} disabled={disableNext} className="disabled:text-[#A1E5FA]">
          <MdNavigateNext size={24} />
        </button>
      </div>
    </div>
  )
}
