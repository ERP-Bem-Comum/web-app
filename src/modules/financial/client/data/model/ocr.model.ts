/**
 * Modelo do OCR de documento (Lançar Documento) — a COSTURA pronta para o backend de ingestão por OCR
 * (core-api#62, "Fatia 7 — ingestão via OCR + enriquecimento"). Hoje o serviço não existe (provedor TBD,
 * ADR pendente): a borda devolve `ocr-unavailable`. Quando o backend entregar, é só implementar a chamada
 * no adapter core-api e mapear o response para `OcrExtractionResult` — o restante do fluxo já está cabeado.
 */
import type { DocumentType, RetentionType } from './document.model.ts'

// Campos que o OCR pode extrair de um documento fiscal — todos OPCIONAIS (o OCR pode falhar por campo).
// Valores monetários em CENTAVOS (string), datas em ISO (YYYY-MM-DD) — mesma convenção do core-api.
export type OcrExtractedFields = Readonly<{
  type?: DocumentType
  documentNumber?: string
  series?: string
  supplierTaxId?: string // CNPJ/CPF p/ casar com um parceiro (resolução = passo futuro)
  grossValueCents?: string
  dueDate?: string // ISO
  issueDate?: string // ISO (emissão — depende de core-api#163)
  description?: string
  retentions?: readonly Readonly<{ type: RetentionType; valueCents: string }>[]
}>

export type OcrExtractionResult = Readonly<{
  fields: OcrExtractedFields
  confidence: number // 0..1 — confiança global da extração (o operador sempre confirma; OCR não confirma)
}>

// Erros do fluxo de OCR (valores; sem throw). `ocr-unavailable` = backend ainda não existe (core-api#62).
export type OcrError = 'ocr-unavailable' | 'ocr-failed' | 'unauthorized'
