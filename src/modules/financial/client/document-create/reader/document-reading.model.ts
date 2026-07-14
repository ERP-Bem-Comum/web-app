/**
 * DocumentReading — modelo UNIFICADO de saída do leitor client-side (§XI · PURO, sem React/DOM/I/O).
 *
 * Independente do leiaute de origem (XML nacional/ABRASF/SP, NF-e produto, ou gabarito de PDF): cada parser/motor
 * produz esta mesma forma para o mapeador (`document-reading.view.ts`) casar com os campos do formulário. Erros
 * como valores (§II): o leitor devolve o modelo (parcial) ou `null` — NUNCA lança p/ a UI.
 *
 * Convenções: identificadores em EN (idioma do código); valores monetários em REAIS (número, ex.: 4000 = R$
 * 4.000,00); datas em ISO `YYYY-MM-DD`; competência em `MM/AAAA`.
 */

/** Categoria da nota — serviço (NFS-e/RPA) ou produto (NF-e modelo 55). */
export type ReadingCategory = 'service' | 'product'

/** Retenções de serviço (valores RETIDOS, em reais). 0 = não retido / ausente. */
export type ReadingRetentions = Readonly<{
  iss: number
  irrf: number
  inss: number
  pis: number
  cofins: number
  csll: number
}>

/** Reforma Tributária (CBS/IBS) — registro de valor apenas (em reais). */
export type ReadingReformaTributaria = Readonly<{
  cbs: number
  ibsMunicipal: number
  ibsEstadual: number
}>

/** Impostos de nota de PRODUTO (NF-e 55) — carregados p/ auditoria; sem campo-alvo no form hoje. */
export type ReadingProductTaxes = Readonly<{
  icms: number
  ipi: number
  pis: number
  cofins: number
  vTotTrib: number
}>

/** Emitente/prestador = fornecedor (o que a nota declara). */
export type ReadingSupplier = Readonly<{
  taxId: string | null // CNPJ/CPF cru (com ou sem pontuação)
  name: string | null
}>

export type DocumentReading = Readonly<{
  /** Rótulo do documento como aparece na nota: `'NFS-e'` | `'NF-e'`. */
  kind: 'NFS-e' | 'NF-e'
  category: ReadingCategory
  number: string | null
  series: string | null
  competence: string | null // MM/AAAA
  issueDate: string | null // YYYY-MM-DD
  grossValue: number // reais
  description: string | null
  accessKey: string | null
  supplier: ReadingSupplier
  retentions: ReadingRetentions
  reformaTributaria: ReadingReformaTributaria
  productTaxes: ReadingProductTaxes | null
}>

export const EMPTY_READING_RETENTIONS: ReadingRetentions = {
  iss: 0,
  irrf: 0,
  inss: 0,
  pis: 0,
  cofins: 0,
  csll: 0,
}

export const EMPTY_READING_REFORMA: ReadingReformaTributaria = {
  cbs: 0,
  ibsMunicipal: 0,
  ibsEstadual: 0,
}
