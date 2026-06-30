/**
 * contract-list.controller.ts — Estado transiente da listagem (ADR-0009).
 */
import { useReducer, useState } from 'react'

interface State {
  readonly showFilters: boolean
}

type Action =
  | { readonly type: 'TOGGLE_FILTERS' }
  | { readonly type: 'SET_SHOW_FILTERS'; readonly payload: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TOGGLE_FILTERS':
      return { ...state, showFilters: !state.showFilters }
    case 'SET_SHOW_FILTERS':
      return { ...state, showFilters: action.payload }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

export function useContractListController() {
  const [state, dispatch] = useReducer(reducer, { showFilters: false })
  // "Agora" estável por carga de página (lazy) — base do filtro "vencendo", fora do render da view (C1).
  const [nowMs] = useState(() => Date.now())

  return {
    showFilters: state.showFilters,
    nowMs,
    toggleFilters: () => {
      dispatch({ type: 'TOGGLE_FILTERS' })
    },
  } as const
}
