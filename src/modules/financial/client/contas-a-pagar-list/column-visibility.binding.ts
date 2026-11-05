/**
 * Seletor de colunas (spec 129) — binding ADAPTER (React + localStorage). A preferência é POR NAVEGADOR,
 * como as Visões salvas; a lógica pura (parse/serialize/toggle) vem da view-model.
 *
 * `useSyncExternalStore`, não `useState(load)`: no SSR não há localStorage, então o servidor renderiza
 * todas as colunas (`getServerSnapshot` = nada escondido) e o client aplica a preferência logo depois da
 * hidratação, sem mismatch. De quebra, outra aba que mude as colunas atualiza esta (evento `storage`).
 */
import { useMemo, useSyncExternalStore } from 'react'

import {
  NO_HIDDEN_COLUMNS,
  parseHiddenColumns,
  serializeHiddenColumns,
  toggleHiddenColumn,
  type HiddenColumns,
} from './column-visibility.view-model.ts'
import type { ColumnKey } from './contas-a-pagar.view-model.ts'

// Chave VERSIONADA, mesmo critério do `cap.savedViews.v1`.
const STORAGE_KEY = 'cap.hiddenColumns.v1'

const listeners = new Set<() => void>()
// Fallback em memória p/ quando o localStorage não existe (modo privado/bloqueado): a escolha vale até
// recarregar a tela, só não persiste.
const memory: { raw: string | null } = { raw: null }

const readRaw = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return memory.raw
  }
}

const writeRaw = (raw: string): void => {
  memory.raw = raw
  try {
    window.localStorage.setItem(STORAGE_KEY, raw)
  } catch {
    // localStorage indisponível → segue em memória (aceitável p/ UI-state).
  }
  listeners.forEach((notify) => {
    notify()
  })
}

const subscribe = (onChange: () => void): (() => void) => {
  listeners.add(onChange)
  const onStorage = (e: StorageEvent): void => {
    if (e.key === STORAGE_KEY) onChange()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onStorage)
  }
}

const serverRaw = (): string | null => null

export type ColumnVisibilityBinding = Readonly<{
  hiddenColumns: HiddenColumns
  onToggleColumn: (key: ColumnKey) => void
  onShowAllColumns: () => void
}>

export function useColumnVisibility(): ColumnVisibilityBinding {
  // O snapshot é a STRING crua (estável entre leituras); o Set sai dela por memo.
  const raw = useSyncExternalStore(subscribe, readRaw, serverRaw)
  const hiddenColumns = useMemo(() => parseHiddenColumns(raw), [raw])

  return {
    hiddenColumns,
    onToggleColumn: (key) => {
      writeRaw(serializeHiddenColumns(toggleHiddenColumn(hiddenColumns, key)))
    },
    onShowAllColumns: () => {
      writeRaw(serializeHiddenColumns(NO_HIDDEN_COLUMNS))
    },
  }
}
