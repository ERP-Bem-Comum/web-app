/**
 * Gateway da INGESTÃO por OCR (client/data) — a PORTA do client para a server function `ingestDocumentFn`.
 * Erros como valores (sem throw). O upload binário atravessa a fronteira como base64 (o server decodifica →
 * bytes → octet-stream ao core-api). Aceita `.pdf`/`.xml` por **MIME OU extensão** (lição pdf-attach-mime-bug:
 * nunca gatear só por `File.type`); tipo fora da allowlist → `invalid-mime` ANTES de subir.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import { ingestDocumentFn } from '#modules/financial/server/adapters/server-fns/ingest-document.service.fn.ts'

import { fileToBase64 } from './file-base64.ts'
import type { OcrIngestResult, OcrError } from './model/ocr.model.ts'

// Allowlist do endpoint (#62): PDF + XML. Union literal p/ casar com o enum Zod da server-fn (o server revalida).
type IngestMime = 'application/pdf' | 'text/xml' | 'application/xml'

/**
 * Infere o mimeType a enviar: aceita por MIME (se já é da allowlist) OU por extensão (.pdf/.xml). `null` quando
 * não é PDF nem XML — o chamador barra com `invalid-mime` sem subir o arquivo. Nunca confia só em `File.type`.
 */
const inferIngestMime = (file: File): IngestMime | null => {
  const type = file.type.toLowerCase()
  if (type === 'application/pdf' || type === 'text/xml' || type === 'application/xml') return type
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return 'application/pdf'
  if (name.endsWith('.xml')) return 'application/xml'
  return null
}

export const extractDocumentOcr = async (file: File): Promise<Result<OcrIngestResult, OcrError>> => {
  const mimeType = inferIngestMime(file)
  if (mimeType === null) return err('invalid-mime')

  const dataBase64 = await fileToBase64(file)
  // `createServerFn` LANÇA em erro de transporte (413 payload, 500, rede) — capturamos p/ manter o
  // contrato de erro-como-valor (§II) e NÃO deixar a mutation cair em estado silencioso na UI.
  try {
    const r = await ingestDocumentFn({ data: { fileName: file.name, mimeType, dataBase64 } })
    return r.ok ? ok({ documentId: r.documentId, resolvedVia: r.resolvedVia }) : err(r.error)
  } catch {
    return err('server')
  }
}
