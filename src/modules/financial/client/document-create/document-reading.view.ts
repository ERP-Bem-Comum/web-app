/**
 * document-reading.view — mapa PURO (§XI) do `DocumentReading` (saída do leitor client-side, ADR-0021) para o
 * patch dos campos do formulário + o conjunto de campos a acender em âmbar ("OCR"). Também casa o CNPJ do
 * emitente contra os parceiros já carregados no client.
 *
 * Regras: valores monetários viram máscara em reais (reuso de `money.ts`); retenções e reforma só entram quando
 * > 0 (não sobrescrevem com "0,00" nem acendem o destaque à toa); `NF-e` (produto) → tipo `DANFE`.
 */
import { maskMoneyBRL } from '#modules/financial/client/data/money.ts'
import { normalizeCnpj } from '#shared/document/cnpj.ts'
import type { DocumentType } from '#modules/financial/client/data/model/document.model.ts'

import type { DocumentReading } from './reader/document-reading.model.ts'
import type { DocumentReadingPatch, OcrFieldKey, PartnerOption } from './document-form.view.ts'

/** Reais (número) → máscara "1.234,56" (sem R$). 0/negativo → `null` (não preenche). */
const reaisToMask = (reais: number): string | null => {
  if (!Number.isFinite(reais) || reais <= 0) return null
  return maskMoneyBRL(String(Math.round(reais * 100)))
}

/** `'NFS-e'` → `'NFS-e'`; `'NF-e'` (produto) → `'DANFE'`. */
const documentTypeOf = (kind: DocumentReading['kind']): DocumentType => (kind === 'NF-e' ? 'DANFE' : 'NFS-e')

export type ReadingMapResult = Readonly<{
  patch: DocumentReadingPatch
  ocrKeys: ReadonlySet<OcrFieldKey>
}>

/**
 * Converte o `DocumentReading` no patch do form + o set de campos lidos (para o destaque âmbar). Não resolve o
 * fornecedor (isso exige a lista de parceiros — ver `matchPartnerByTaxId`, chamado na página).
 */
export const mapReadingToPatch = (reading: DocumentReading): ReadingMapResult => {
  const keys = new Set<OcrFieldKey>()
  const patch: {
    -readonly [K in keyof DocumentReadingPatch]: DocumentReadingPatch[K]
  } = {}

  patch.type = documentTypeOf(reading.kind)
  keys.add('type')

  if (reading.number !== null) {
    patch.documentNumber = reading.number
    keys.add('documentNumber')
  }
  if (reading.series !== null) {
    patch.series = reading.series
    keys.add('series')
  }
  if (reading.issueDate !== null) {
    patch.issueDate = reading.issueDate
    keys.add('issueDate')
  }
  // Competência: o leitor tem prioridade; senão o controller a deriva da emissão.
  if (reading.competence !== null) patch.competencia = reading.competence

  const gross = reaisToMask(reading.grossValue)
  if (gross !== null) {
    patch.grossValue = gross
    keys.add('grossValue')
  }
  if (reading.description !== null) {
    patch.description = reading.description
    keys.add('description')
  }
  if (reading.accessKey !== null) {
    patch.accessKey = reading.accessKey
    keys.add('accessKey')
  }

  // Retenções: só as > 0. Cada uma acende o destaque.
  const ret: Record<string, string> = {}
  const retMap: readonly (readonly [keyof DocumentReading['retentions'], OcrFieldKey])[] = [
    ['iss', 'iss'],
    ['irrf', 'irrf'],
    ['inss', 'inss'],
    ['pis', 'pis'],
    ['cofins', 'cofins'],
    ['csll', 'csll'],
  ]
  for (const [readingKey, ocrKey] of retMap) {
    const masked = reaisToMask(reading.retentions[readingKey])
    if (masked !== null) {
      ret[readingKey] = masked
      keys.add(ocrKey)
    }
  }
  if (Object.keys(ret).length > 0) patch.retentions = ret

  // Reforma Tributária (CBS/IBS): registra o valor, mas NÃO acende o destaque (convenção do `ocrReadFields`).
  const reforma: Record<string, string> = {}
  const cbs = reaisToMask(reading.reformaTributaria.cbs)
  const ibsMun = reaisToMask(reading.reformaTributaria.ibsMunicipal)
  const ibsEst = reaisToMask(reading.reformaTributaria.ibsEstadual)
  if (cbs !== null) reforma.cbs = cbs
  if (ibsMun !== null) reforma.ibsMunicipal = ibsMun
  if (ibsEst !== null) reforma.ibsEstadual = ibsEst
  if (Object.keys(reforma).length > 0) patch.reformaTributaria = reforma

  return { patch, ocrKeys: keys }
}

/**
 * Casa o CNPJ/CPF do emitente contra a lista de parceiros (subtítulo = documento). Normaliza ambos (ignora
 * pontuação/caixa; cobre CNPJ alfanumérico Serpro 2026). Devolve o `id` do parceiro ou `null` (não inventa ref).
 */
export const matchPartnerByTaxId = (
  partners: readonly PartnerOption[],
  taxId: string | null,
): string | null => {
  if (taxId === null) return null
  const target = normalizeCnpj(taxId)
  if (target === '') return null
  const hit = partners.find((p) => normalizeCnpj(p.subtitle) === target)
  return hit?.id ?? null
}
