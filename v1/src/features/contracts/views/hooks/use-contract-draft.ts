import { useEffect, useRef, useCallback } from 'react'

const DRAFT_KEY = 'contract-draft'
const SAVE_INTERVAL_MS = 30_000

export type DraftData = Record<string, unknown>

export function useContractDraft() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const saveDraft = useCallback((data: DraftData) => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data))
    } catch {
      // sessionStorage pode estar cheio ou indisponível
    }
  }, [])

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      return raw ? (JSON.parse(raw) as DraftData) : null
    } catch {
      return null
    }
  }, [])

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
  }, [])

  const startAutoSave = useCallback(
    (getData: () => DraftData) => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        saveDraft(getData())
      }, SAVE_INTERVAL_MS)
    },
    [saveDraft]
  )

  const stopAutoSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopAutoSave()
    }
  }, [stopAutoSave])

  return { saveDraft, loadDraft, clearDraft, startAutoSave, stopAutoSave }
}
