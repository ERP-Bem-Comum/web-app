/**
 * contract-list.controller.ts — Estado transiente da listagem (ADR-0009).
 */
import { useReducer } from 'react'

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

  return {
    showFilters: state.showFilters,
    toggleFilters: () => {
      dispatch({ type: 'TOGGLE_FILTERS' })
    },
  } as const
}
