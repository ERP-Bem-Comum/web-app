/**
 * Visões salvas de Contas a Pagar — binding ADAPTER (React + I/O). É o único lugar com o acoplamento a
 * `useState`, `crypto.randomUUID` e `localStorage`; a lógica pura (capturar/serializar/parsear) vem da
 * view-model. Guarda a preferência de UI POR NAVEGADOR (front-first): a persistência server-side no BFF
 * (por usuário) é upgrade futuro — o issue diz "web-app guarda", e o localStorage satisfaz isso hoje.
 *
 * O binding NÃO é dono do estado dos filtros — o `contas-a-pagar.binding.ts` é. Aqui recebemos o snapshot
 * atual (para capturar) e um `applyView` (para reconstruir o estado num único update), mantendo a fonte da
 * verdade única no binding-mãe (§XI).
 */
import { useState } from 'react'

import {
  captureView,
  parseViews,
  serializeViews,
  type SavedView,
} from './contas-a-pagar-saved-views.view-model.ts'
import type { AdvancedFilters, FilterDimId, DocumentStatus } from './contas-a-pagar.view-model.ts'

// Chave VERSIONADA (`.v1`): se o shape do snapshot mudar de forma incompatível, sobe-se p/ `.v2` e o
// `.v1` é ignorado (parse tolerante já devolve `[]` p/ shape desconhecido).
const STORAGE_KEY = 'cap.savedViews.v1'

// Snapshot atual da tela — o que uma nova visão captura. Espelha o estado do binding-mãe.
export type CurrentViewSnapshot = Readonly<{
  status: DocumentStatus | null
  dims: readonly FilterDimId[]
  filters: AdvancedFilters
}>

// Aplica uma visão reconstruindo o estado dos filtros. O binding-mãe implementa isto com um ÚNICO update
// (status + dims + filters de uma vez, auto-batched), não N setters encadeados.
export type ApplyViewSnapshot = (view: Pick<SavedView, 'status' | 'dims' | 'filters'>) => void

export type SavedViewsBinding = Readonly<{
  savedViews: readonly SavedView[]
  onSaveView: (name: string) => void
  onApplyView: (id: string) => void
  onDeleteView: (id: string) => void
}>

// Lê as visões do localStorage no init (lazy). Tolerante: SSR / modo privado / storage desabilitado → [].
const loadViews = (): readonly SavedView[] => {
  try {
    return parseViews(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return [] // localStorage indisponível (SSR/modo privado) → sem visões
  }
}

// Escreve as visões (a cada mudança). Falha silenciosa: a preferência segue em memória, só não persiste.
const writeViews = (views: readonly SavedView[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeViews(views))
  } catch {
    // localStorage indisponível → preferência não persiste (aceitável p/ UI-state).
  }
}

// id novo — `crypto.randomUUID` quando disponível; fallback simples (tempo + aleatório) p/ ambientes sem.
const newViewId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `sv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function useSavedViews(
  snapshot: CurrentViewSnapshot,
  applyView: ApplyViewSnapshot,
): SavedViewsBinding {
  const [savedViews, setSavedViews] = useState<readonly SavedView[]>(loadViews)

  // Persiste em memória (render) E no localStorage (durabilidade), sempre juntos.
  const persist = (next: readonly SavedView[]): void => {
    setSavedViews(next)
    writeViews(next)
  }

  return {
    savedViews,
    onSaveView: (name) => {
      const trimmed = name.trim()
      if (trimmed === '') return // nome vazio não vira visão (a view já desabilita, mas guarda aqui também)
      const view: SavedView = {
        ...captureView(trimmed, snapshot.status, snapshot.dims, snapshot.filters),
        id: newViewId(),
      }
      persist([...savedViews, view])
    },
    onApplyView: (id) => {
      const view = savedViews.find((v) => v.id === id)
      if (view === undefined) return // visão sumiu (corrida com delete) → no-op
      applyView({ status: view.status, dims: view.dims, filters: view.filters })
    },
    onDeleteView: (id) => {
      persist(savedViews.filter((v) => v.id !== id))
    },
  }
}
