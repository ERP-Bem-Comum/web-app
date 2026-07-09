/**
 * Binding do WEB VIEW do documento ingerido (Lançar Documento) — ADAPTER React. Recebe o `File` que o
 * operador subiu (mantido no estado da page, sobrevive à navegação mesma-rota create→edit) e o converte
 * na FONTE de pré-visualização:
 *  - PDF  → `blob:` via `URL.createObjectURL` (revogada no cleanup; CSP libera `frame-src blob:`);
 *  - XML  → texto puro (`File.text()`) para render honesto (não renderizamos a nota estilizada — decisão P.O.);
 *  - resto → `unsupported` (a allowlist já barra antes de subir; guarda defensiva).
 * O browser NUNCA re-busca os bytes do backend: o preview reusa o mesmo arquivo local. Sem dado → `null`.
 */
import { useEffect, useMemo, useState } from 'react'

import type { DocumentPreviewData } from './document-form.view.ts'

const isPdf = (f: File): boolean =>
  f.type.toLowerCase() === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
const isXml = (f: File): boolean =>
  f.type.toLowerCase().includes('xml') || f.name.toLowerCase().endsWith('.xml')

/**
 * Deriva a fonte de preview do `File`. O PDF vira object URL via `useMemo` (recurso de plataforma; um effect
 * só REVOGA no cleanup). O texto do XML é assíncrono → estado GUARDADO pelo próprio `File` (o read stale de um
 * arquivo anterior é ignorado), então o `setState` acontece só no callback do `.then` (sem cascata no effect).
 * Enquanto o texto não chega, retorna `null` (o chamador trata como "sem preview ainda").
 */
export function useDocumentPreview(file: File | null): DocumentPreviewData | null {
  const pdfUrl = useMemo(() => (file !== null && isPdf(file) ? URL.createObjectURL(file) : null), [file])
  useEffect(
    () => () => {
      if (pdfUrl !== null) URL.revokeObjectURL(pdfUrl)
    },
    [pdfUrl],
  )

  const [xml, setXml] = useState<Readonly<{ file: File; text: string }> | null>(null)
  useEffect(() => {
    if (file === null || !isXml(file)) return
    let alive = true
    void file.text().then((text) => {
      if (alive) setXml({ file, text })
    })
    return () => {
      alive = false
    }
  }, [file])

  if (file === null) return null
  if (isPdf(file)) return pdfUrl !== null ? { kind: 'pdf', url: pdfUrl, fileName: file.name } : null
  if (isXml(file)) {
    return xml !== null && xml.file === file ? { kind: 'xml', text: xml.text, fileName: file.name } : null
  }
  return { kind: 'unsupported', fileName: file.name }
}
