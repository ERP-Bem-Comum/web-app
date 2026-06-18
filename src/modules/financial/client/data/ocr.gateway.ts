/**
 * Gateway do OCR (client/data) — a PORTA do client para a server function de OCR. Erros como valores
 * (sem throw). Hoje sempre devolve `ocr-unavailable` (o backend não existe — core-api#62). Quando a borda
 * passar a retornar sucesso, mapear `r.result` → `OcrExtractionResult` aqui.
 */
import { err, type Result } from '#shared/primitives/result.ts'
import { extractDocumentOcrFn } from '#modules/financial/server/adapters/server-fns/extract-document-ocr.query.fn.ts'

import type { OcrExtractionResult, OcrError } from './model/ocr.model.ts'

export const extractDocumentOcr = async (file: File): Promise<Result<OcrExtractionResult, OcrError>> => {
  const r = await extractDocumentOcrFn({ data: { fileName: file.name } })
  // r.ok é sempre `false` hoje (a borda devolve indisponível). Quando o backend de OCR existir, a server
  // fn ganhará o ramo de sucesso e este gateway mapeará `r.result` em `ok(...)`.
  return err(r.error)
}
