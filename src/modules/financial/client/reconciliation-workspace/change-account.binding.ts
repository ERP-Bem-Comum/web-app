/**
 * useChangeAccount — controller do modal "Alterar conta" (troca de conta sem voltar ao grid). UI-state
 * (open/search) + query da listagem de contas (compartilha a queryKey com o grid). A listagem real depende
 * de core-api#168 → até lá a porta devolve `err('unavailable')` e o modal mostra o aviso honesto (sem
 * fabricar contas). Selecionar uma conta navega p/ o workspace dela; "Adicionar" leva ao grid (TELA 1).
 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { groupAccountsForSwitch, type ChangeAccountGroups } from './reconciliation-workspace.view-model.ts'

const accountsQueryOptions = (enabled: boolean) => ({
  // Mesma queryKey do grid (TELA 1) → compartilha cache da listagem de contas (#168).
  queryKey: ['financial', 'reconciliation', 'accounts'] as const,
  queryFn: () => reconciliationRepository.listAccounts(),
  staleTime: 60_000,
  enabled,
})

export type ChangeAccountListState =
  | Readonly<{ tag: 'loading' }>
  | Readonly<{ tag: 'unavailable' }> // #168 (sem endpoint p/ listar contas)
  | Readonly<{ tag: 'empty' }>
  | Readonly<{ tag: 'ready'; groups: ChangeAccountGroups }>

export type ChangeAccountBinding = Readonly<{
  open: boolean
  search: string
  list: ChangeAccountListState
  openModal: () => void
  close: () => void
  setSearch: (v: string) => void
  select: (id: string) => void
  add: () => void
}>

export function useChangeAccount(currentAccountId: string): ChangeAccountBinding {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const query = useQuery(accountsQueryOptions(open))

  const list: ChangeAccountListState = (() => {
    if (query.isLoading) return { tag: 'loading' }
    if (query.data?.ok === false) return { tag: 'unavailable' }
    const accounts = query.data?.ok === true ? query.data.value : []
    if (accounts.length === 0) return { tag: 'empty' }
    return { tag: 'ready', groups: groupAccountsForSwitch(accounts, currentAccountId, search) }
  })()

  return {
    open,
    search,
    list,
    openModal: () => {
      setOpen(true)
    },
    close: () => {
      setOpen(false)
      setSearch('')
    },
    setSearch: (v) => {
      setSearch(v)
    },
    select: (id) => {
      setOpen(false)
      setSearch('')
      void navigate({ to: '/financeiro/conciliacao/$accountId', params: { accountId: id } })
    },
    add: () => {
      setOpen(false)
      void navigate({ to: '/financeiro/conciliacao' })
    },
  }
}
