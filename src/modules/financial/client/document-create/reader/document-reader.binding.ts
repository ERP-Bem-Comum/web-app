/**
 * document-reader.binding — ADAPTER React client-only (§XI · ADR-0009, ADR-0021) do LEITOR por gabarito. Recebe
 * o `File` que o operador subiu e produz um `DocumentReading` (ou `null`), mantendo o núcleo (parsers XML +
 * motor de gabarito) 100% PURO. Toda a impureza (I/O do File, pdf.js, import dinâmico) vive AQUI.
 *
 * XML → `file.text()` → `readXml` (puro). PDF → BYTES do `File` (`file.arrayBuffer()`, NUNCA blob URL: a CSP
 * `connect-src 'self'` não cobre `blob:`) → pdf.js `getTextContent` (coordenadas) → `groupLines`+`readPdfLines`.
 * Worker same-origin (mesmo asset do #071). Cancelável: uma nova leitura invalida a anterior (sem stale).
 *
 * Erros como valores (§II): qualquer falha vira `reading: null` (degradação graciosa) — nunca lança p/ a UI.
 */
import { useEffect, useState } from 'react'

import type { PDFDocumentLoadingTask } from 'pdfjs-dist'

import type { DocumentReading } from './document-reading.model.ts'
import { readXml } from './xml/read-xml.ts'
import { readPdfLines } from './pdf/read-pdf-lines.ts'
import { groupLines, type TextItem } from './pdf/gabarito-engine.ts'

// Worker same-origin bundlado pelo Vite (asset com hash). String pura → segura no SSR (ver #071/ADR-0006).
const PDF_WORKER_URL = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

/** Estado do leitor (união discriminada §IV): idle · reading · done (achou modelo) · empty (sem gabarito/XML). */
export type DocumentReaderStatus = 'idle' | 'reading' | 'done' | 'empty'

export type DocumentReaderBinding = Readonly<{
  reading: DocumentReading | null
  status: DocumentReaderStatus
}>

/** Lê um índice de um array de números (coordenada do `transform` do pdf.js), com fallback seguro. */
const coord = (arr: readonly number[], i: number): number => arr[i] ?? 0

const isPdf = (f: File): boolean =>
  f.type.toLowerCase() === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
const isXml = (f: File): boolean =>
  f.type.toLowerCase().includes('xml') || f.name.toLowerCase().endsWith('.xml')

/** Guard: item de texto do pdf.js (tem `str` + `transform`). */
const isTextItem = (v: unknown): v is { str: string; transform: readonly number[]; width?: number } =>
  typeof v === 'object' &&
  v !== null &&
  'str' in v &&
  typeof v.str === 'string' &&
  'transform' in v &&
  Array.isArray((v as { transform: unknown }).transform)

/** Extrai `TextItem[]` (texto + coordenadas) da camada de texto do PDF, página a página. */
const extractPdfTextItems = async (bytes: Uint8Array): Promise<readonly TextItem[]> => {
  const pdfjs = await import('pdfjs-dist')
  if (pdfjs.GlobalWorkerOptions.workerSrc === '') {
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL
  }
  let task: PDFDocumentLoadingTask | null = null
  try {
    task = pdfjs.getDocument({ data: bytes, useWasm: false })
    const doc = await task.promise
    const items: TextItem[] = []
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      for (const raw of content.items) {
        if (!isTextItem(raw)) continue
        const s = raw.str.trim()
        if (s === '') continue
        items.push({
          str: s,
          x: coord(raw.transform, 4),
          y: coord(raw.transform, 5),
          width: raw.width ?? 0,
          page: p,
        })
      }
    }
    return items
  } finally {
    if (task !== null) void task.destroy()
  }
}

/** Deriva o `DocumentReading` a partir do `File` (assíncrono p/ PDF). Retorna `null` em qualquer falha. */
const readFile = async (file: File): Promise<DocumentReading | null> => {
  try {
    if (isXml(file)) return readXml(await file.text())
    if (isPdf(file)) {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const items = await extractPdfTextItems(bytes)
      return readPdfLines(groupLines(items))
    }
    return null
  } catch {
    return null
  }
}

/**
 * Lê o `file` (client-side) e devolve o `DocumentReading` derivado. Recalcula a cada troca de `file`; a leitura
 * anterior é descartada (flag de cancelamento) para não aplicar um resultado stale. `file === null` → idle.
 */
export function useDocumentReader(file: File | null): DocumentReaderBinding {
  // Estado ÚNICO (reading + status juntos). Só é atualizado no callback ASSÍNCRONO da leitura (nunca de forma
  // síncrona no corpo do efeito) → sem cascata de renders. A leitura anterior é descartada (flag `cancelled`).
  const [state, setState] = useState<DocumentReaderBinding>({ reading: null, status: 'idle' })

  useEffect(() => {
    const token = { cancelled: false }
    const run = async (): Promise<DocumentReaderBinding> => {
      if (file === null) return { reading: null, status: 'idle' }
      const result = await readFile(file)
      return { reading: result, status: result !== null ? 'done' : 'empty' }
    }
    void run().then((next) => {
      if (!token.cancelled) setState(next)
    })
    return () => {
      token.cancelled = true
    }
  }, [file])

  return state
}
