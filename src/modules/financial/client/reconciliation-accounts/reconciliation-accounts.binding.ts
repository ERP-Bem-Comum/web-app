/**
 * Binding do grid de contas-cedente (TELA 1) — ADAPTER React (UI-state + query). A listagem real depende
 * de core-api#168; até lá a porta devolve `err('unavailable')` → estado `unavailable` (chrome honesto,
 * sem fabricar). A page é burra. Espelha `contas-a-pagar.binding.ts`.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import {
  accountStatus,
  bankNameByCode,
  consolidate,
  deriveAccountRows,
  type AccountsState,
  type SortKey,
  type StatusFilter,
} from './reconciliation-accounts.view-model.ts'
import { useAddAccount, type AddAccountBinding } from './add-account.binding.ts'

export type ChipCounts = Readonly<{ todas: number; pendentes: number; emDia: number; encerradas: number }>
const EMPTY_COUNTS: ChipCounts = { todas: 0, pendentes: 0, emDia: 0, encerradas: 0 }

const accountsQueryOptions = () => ({
  queryKey: ['financial', 'reconciliation', 'accounts'] as const,
  queryFn: () => reconciliationRepository.listAccounts(),
  staleTime: 60_000,
})

export type AccountsBinding = Readonly<{
  state: AccountsState
  counts: ChipCounts
  search: string
  status: StatusFilter
  sort: SortKey
  addOpen: boolean
  add: AddAccountBinding
  expanded: ReadonlySet<string> // ids das contas com o expand do cadastro aberto
  setSearch: (v: string) => void
  setStatus: (v: StatusFilter) => void
  setSort: (v: SortKey) => void
  openAdd: () => void
  closeAdd: () => void
  toggleExpanded: (id: string) => void
}>

export function useReconciliationAccounts(): AccountsBinding {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todas')
  const [sort, setSort] = useState<SortKey>('pendencias')
  const [addOpen, setAddOpen] = useState(false)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const add = useAddAccount(bankNameByCode, () => {
    setAddOpen(false)
  })
  const q = useQuery(accountsQueryOptions())

  const state: AccountsState = (() => {
    if (q.isLoading) return { tag: 'loading' }
    if (q.data?.ok === false) {
      return q.data.error === 'unavailable'
        ? { tag: 'unavailable' }
        : { tag: 'error', errorTag: reconciliationErrorTag(q.data.error) }
    }
    const accounts = q.data?.ok === true ? q.data.value : []
    if (accounts.length === 0) return { tag: 'empty' }
    const rows = deriveAccountRows(accounts, { search, status, sort })
    return { tag: 'ready', rows, consolidated: consolidate(accounts) }
  })()

  const allAccounts = q.data?.ok === true ? q.data.value : []
  const counts: ChipCounts = {
    todas: allAccounts.length,
    pendentes: allAccounts.filter((a) => accountStatus(a) === 'pending').length,
    emDia: allAccounts.filter((a) => accountStatus(a) === 'up-to-date').length,
    encerradas: allAccounts.filter((a) => accountStatus(a) === 'closed').length,
  }

  return {
    state,
    counts: state.tag === 'ready' ? counts : EMPTY_COUNTS,
    search,
    status,
    sort,
    addOpen,
    add,
    expanded,
    toggleExpanded: (id) => {
      setExpanded((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    },
    setSearch: (v) => {
      setSearch(v)
    },
    setStatus: (v) => {
      setStatus(v)
    },
    setSort: (v) => {
      setSort(v)
    },
    openAdd: () => {
      setAddOpen(true)
    },
    closeAdd: () => {
      setAddOpen(false)
    },
  }
}
