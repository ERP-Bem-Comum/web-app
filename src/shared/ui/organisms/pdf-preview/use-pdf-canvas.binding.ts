/**
 * usePdfCanvas — ADAPTER React (§XI · ADR-0009) que RASTERIZA um PDF em `<canvas>` empilhados. Todo o
 * acoplamento a plataforma (pdf.js + canvas 2D + `devicePixelRatio` + import dinâmico client-only) vive
 * AQUI; a lógica pura de escala fica em `pdf-preview.view.ts`, e a view (`*.component.tsx`) só apresenta.
 *
 * Client-only: o pdf.js é importado DINAMICAMENTE dentro do effect (o `blob:`/`File` é client-only e o
 * import não pode entrar no bundle SSR). No servidor o effect não roda → `status: 'idle'` (placeholder).
 *
 * CSP (ADR-0006): o worker é um asset SAME-ORIGIN emitido pelo Vite (`/assets/pdf.worker-<hash>.mjs`),
 * coberto por `default-src 'self'` (não há `worker-src` → fallback). Nada de blob-worker/CDN. `useWasm:false`
 * dispensa `wasm-unsafe-eval` (DANFSe/DANFE são texto/vetor); o pdf.js v6 não usa `eval`.
 *
 * Ciclo de vida: cada troca de `url`/`zoom`/unmount CANCELA o `renderTask` em voo e DESTRÓI o
 * `loadingTask` (sem vazamento nem "Canvas already in use" — canvases são recriados do zero a cada render).
 */
import { useEffect, useRef, useState, type RefObject } from 'react'

import type { PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist'

import { backingScale, cssPxFromBacking } from './pdf-preview.view.ts'

// Worker same-origin bundlado pelo Vite (`new URL(..., import.meta.url)` → asset com hash). String pura
// (sem acesso a window) → segura no SSR. Ver nota de CSP no cabeçalho.
const PDF_WORKER_URL = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

/** Estado do render (união discriminada §IV): idle (sem/SSR) · loading · ready · error. */
export type PdfCanvasStatus = 'idle' | 'loading' | 'ready' | 'error'

export type PdfCanvas = Readonly<{
  /** Container rolável onde o binding anexa os `<canvas>` das páginas. A view só liga a ref. */
  containerRef: RefObject<HTMLDivElement | null>
  status: PdfCanvasStatus
}>

/**
 * Renderiza o PDF de `url` (blob same-origin) em canvas na escala derivada de `zoomPct` (× dpr).
 * Devolve a ref do container + o status para a view apresentar. `url === null` → idle (nada a renderizar).
 */
export function usePdfCanvas(url: string | null, zoomPct: number): PdfCanvas {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<PdfCanvasStatus>('idle')

  useEffect(() => {
    const container = containerRef.current
    if (url === null || container === null) {
      setStatus('idle')
      return
    }

    // Flag de cancelamento lida por FUNÇÃO de propósito: como `state` é um local não-aliasado, o TS
    // manteria a narrowing de um booleano/propriedade a literal (o cleanup só muta em closure, entre
    // `await`s) e o lint acusaria `no-unnecessary-condition`. Ler via `cancelled()` devolve o valor
    // fresco a cada chamada, sem narrowing. `container` capturado é reusado no cleanup (sem ref stale).
    const state = { cancelled: false }
    const cancelled = (): boolean => state.cancelled
    let loadingTask: PDFDocumentLoadingTask | null = null
    let renderTask: RenderTask | null = null

    setStatus('loading')

    void (async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        if (cancelled()) return
        // Idempotente: define o worker uma única vez no processo (o pdf.js o reusa entre documentos).
        if (pdfjs.GlobalWorkerOptions.workerSrc === '') {
          pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL
        }

        loadingTask = pdfjs.getDocument({ url, useWasm: false })
        const doc = await loadingTask.promise
        if (cancelled()) return

        const dpr = window.devicePixelRatio
        const scale = backingScale(zoomPct, dpr)

        // Zera o conteúdo anterior — cada render (troca de arquivo/zoom) parte de canvases novos.
        container.replaceChildren()

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          if (cancelled()) break
          const page = await doc.getPage(pageNum)
          if (cancelled()) break
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          // Backing store em pixels de dispositivo (nítido em retina); tamanho CSS = lógico (÷ dpr).
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          canvas.style.inlineSize = `${String(cssPxFromBacking(viewport.width, dpr))}px`
          canvas.style.blockSize = `${String(cssPxFromBacking(viewport.height, dpr))}px`
          container.append(canvas)
          renderTask = page.render({ canvas, viewport })
          await renderTask.promise
        }
        if (!cancelled()) setStatus('ready')
      } catch {
        // Cancelamento (RenderingCancelledException) é esperado no cleanup → não vira erro visível.
        if (!cancelled()) setStatus('error')
      }
    })()

    return () => {
      state.cancelled = true
      if (renderTask !== null) renderTask.cancel()
      if (loadingTask !== null) void loadingTask.destroy()
      container.replaceChildren() // libera o backing store dos canvases
    }
  }, [url, zoomPct])

  return { containerRef, status }
}
