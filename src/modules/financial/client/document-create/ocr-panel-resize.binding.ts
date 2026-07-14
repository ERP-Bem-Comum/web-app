/**
 * useOcrPanelResize — controller (React · ADAPTER) do redimensionamento da coluna OCR do Lançar Documento.
 * UI-state (largura em px) + arraste por pointer (window pointermove/up enquanto arrasta) + teclado (setas,
 * padrão window-splitter) + persistência best-effort em localStorage. A página aplica a largura via a CSS
 * var `--ocr-col-width` inline; o React vive SÓ aqui (§XI · ADR-0009). Lógica pura em `*.view.ts`.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

import {
  OCR_MAX_PX,
  OCR_MIN_PX,
  OCR_STEP_PX,
  clampOcrWidth,
  parseSavedOcrWidth,
} from './ocr-panel-resize.view.ts'

const STORAGE_KEY = 'lancar-documento:ocr-col-width'

// Leitura inicial (best-effort): localStorage indisponível (SSR/privado) → o padrão do parser.
const readSavedWidth = (): number => {
  try {
    return parseSavedOcrWidth(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return parseSavedOcrWidth(null)
  }
}

export type OcrPanelResize = Readonly<{
  widthPx: number
  resizing: boolean
  minPx: number
  maxPx: number
  onHandlePointerDown: (e: PointerEvent) => void
  onHandleKeyDown: (e: KeyboardEvent) => void
}>

export function useOcrPanelResize(): OcrPanelResize {
  const [widthPx, setWidthPx] = useState<number>(readSavedWidth)
  const [resizing, setResizing] = useState(false)
  // Início do arraste (X + largura no down); e a largura corrente p/ persistir no up sem re-render.
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)
  const widthRef = useRef(widthPx)
  // Sincroniza o espelho da largura FORA do render (regra react-hooks/refs): handlers/efeitos leem o ref.
  useEffect(() => {
    widthRef.current = widthPx
  }, [widthPx])

  const persist = useCallback((px: number): void => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(px))
    } catch {
      // localStorage indisponível → só não persiste (largura segue em memória).
    }
  }, [])

  const onHandlePointerDown = useCallback((e: PointerEvent): void => {
    dragRef.current = { startX: e.clientX, startW: widthRef.current }
    setResizing(true)
    e.preventDefault() // evita seleção de texto durante o arraste
  }, [])

  const onHandleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      const dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
      if (dir === 0) return
      e.preventDefault()
      const next = clampOcrWidth(widthRef.current + dir * OCR_STEP_PX)
      setWidthPx(next)
      persist(next)
    },
    [persist],
  )

  // Arraste: escuta no window enquanto `resizing` (o pointer sai da alça fina). Ao soltar, persiste 1x.
  useEffect(() => {
    if (!resizing) return
    const onMove = (e: globalThis.PointerEvent): void => {
      const drag = dragRef.current
      if (drag === null) return
      setWidthPx(clampOcrWidth(drag.startW + (e.clientX - drag.startX)))
    }
    const onUp = (): void => {
      setResizing(false)
      dragRef.current = null
      persist(widthRef.current)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [resizing, persist])

  return {
    widthPx,
    resizing,
    minPx: OCR_MIN_PX,
    maxPx: OCR_MAX_PX,
    onHandlePointerDown,
    onHandleKeyDown,
  }
}
