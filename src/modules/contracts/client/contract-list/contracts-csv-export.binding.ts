/**
 * useContractsCsvExport — ADAPTER React do export CSV "todos os contratos" (legível). A lista é paginada
 * (limit 100); aqui percorremos TODAS as páginas dos filtros ativos, montamos o CSV legível (nome do
 * contratado, R$, datas, status — `buildContractsCsv`) e disparamos o download via Blob+anchor. O backend
 * tem um `export.csv`, mas ele é cru (IDs/centavos/sem nome) — por isso montamos no client a partir da
 * lista enriquecida. Erros viram tag i18n; nunca lança fora da borda.
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { ListContractsInput } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractRow } from '#modules/contracts/client/domain/types.ts'
import {
  mapListResponseToContractRows,
  buildContractsCsv,
  exportFileStamp,
} from './contract-list.view-model.ts'

export type ContractsCsvFilters = Omit<ListContractsInput, 'page' | 'limit'>

export type ContractsCsvExportBinding = Readonly<{
  exportCsv: () => void
  exporting: boolean
  errorTag: string | null
}>

const PAGE_SIZE = 100
const MAX_PAGES = 200 // trava de segurança (até 20k contratos) — evita loop infinito se o meta divergir.

const triggerDownload = (filename: string, csv: string): void => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

type CollectResult = Readonly<{ ok: true; rows: readonly ContractRow[] }> | Readonly<{ ok: false }>

export function useContractsCsvExport(filters: ContractsCsvFilters): ContractsCsvExportBinding {
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: async (): Promise<CollectResult> => {
      const rows: ContractRow[] = []
      let page = 1
      for (;;) {
        const res = await contractsRepository.list({ ...filters, page, limit: PAGE_SIZE })
        if (!res.ok) return { ok: false }
        rows.push(...mapListResponseToContractRows(res.value))
        if (page >= res.value.meta.totalPages || page >= MAX_PAGES) break
        page += 1
      }
      return { ok: true, rows }
    },
    onSuccess: (r) => {
      if (!r.ok) {
        setErrorTag('contracts.list.exportError')
        return
      }
      setErrorTag(null)
      triggerDownload(`contratos-${exportFileStamp()}.csv`, buildContractsCsv(r.rows))
    },
    onError: () => {
      setErrorTag('contracts.list.exportError')
    },
  })

  return {
    exportCsv: () => {
      setErrorTag(null)
      mut.mutate()
    },
    exporting: mut.isPending,
    errorTag,
  }
}
