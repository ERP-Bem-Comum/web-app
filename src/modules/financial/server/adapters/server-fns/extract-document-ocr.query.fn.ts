/**
 * Server function: extrair campos de um documento por OCR (Lançar Documento). Fronteira RPC (§III) — a
 * ÚNICA borda entre client e o futuro serviço de OCR. Hoje o backend NÃO existe (core-api#62, "Fatia 7 —
 * ingestão via OCR"; provedor TBD, ADR pendente, storage S3): a borda devolve `ocr-unavailable` — chrome
 * honesto, sem OCR de fachada. Quando o backend entregar, é só plugar a chamada aqui (atrás de um Port
 * trocável) e devolver o `OcrExtractionResult` — o resto do fluxo (gateway → binding → mapeamento → form)
 * já está cabeado.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'

// Sucesso será adicionado quando o backend de OCR existir (core-api#62); por ora só o ramo de erro.
export type ExtractDocumentOcrFnResult = Readonly<{
  ok: false
  error: 'ocr-unavailable' | 'unauthorized'
}>

const ExtractOcrInputSchema = z.object({ fileName: z.string().trim().min(1).max(255) })

export const extractDocumentOcrFn = createServerFn({ method: 'POST' })
  .inputValidator(ExtractOcrInputSchema)
  .handler(async (): Promise<ExtractDocumentOcrFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    // TODO(core-api#62): integrar o serviço de OCR (upload do arquivo + extração) atrás de um Port
    // trocável e mapear o response → OcrExtractionResult. Enquanto não existe, devolve indisponível.
    return { ok: false, error: 'ocr-unavailable' }
  })
