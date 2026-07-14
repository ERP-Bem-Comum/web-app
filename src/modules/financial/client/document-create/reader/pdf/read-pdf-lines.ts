/**
 * read-pdf-lines — PURO: `Line[]` (já extraídas da camada de texto do PDF) → `DocumentReading`. Detecta o
 * gabarito e traduz o `campos` cru (chaves do gabarito) para o modelo unificado.
 *
 * Limites conhecidos do PDF (vs XML): não há CNPJ/nome do emitente confiável nos gabaritos → `supplier` fica
 * vazio (o casamento por CNPJ só ocorre pelo XML). A DANFSe v1 agrega PIS+COFINS+CSLL em
 * "Contribuições Sociais - Retidas" → mapeado para `csll` (o mapa do form soma pis+cofins+csll em CSRF).
 */
import type { DocumentReading, ReadingCategory } from '../document-reading.model.ts'
import { extractWithGabarito, type FieldValue, type Line } from './gabarito-engine.ts'
import { GABARITOS } from './gabaritos/index.ts'

const numOf = (campos: Readonly<Record<string, FieldValue>>, key: string): number => {
  const v = campos[key]
  return typeof v === 'number' ? v : 0
}

const strOf = (campos: Readonly<Record<string, FieldValue>>, key: string): string | null => {
  const v = campos[key]
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return null
}

export const readPdfLines = (lines: readonly Line[]): DocumentReading | null => {
  const { gabarito, campos } = extractWithGabarito(lines, GABARITOS)
  if (gabarito === null) return null

  const category: ReadingCategory = gabarito === 'DANFE-NFe-Produto' ? 'product' : 'service'

  return {
    kind: category === 'product' ? 'NF-e' : 'NFS-e',
    category,
    number: strOf(campos, 'numero'),
    series: strOf(campos, 'serie'),
    competence: strOf(campos, 'competencia'),
    issueDate: strOf(campos, 'emissao'),
    grossValue: numOf(campos, 'valorBruto'),
    description: null,
    accessKey: strOf(campos, 'chaveAcesso'),
    supplier: { taxId: null, name: null },
    retentions: {
      iss: numOf(campos, 'iss'),
      irrf: numOf(campos, 'irrf'),
      inss: numOf(campos, 'inss'),
      pis: numOf(campos, 'pis'),
      cofins: numOf(campos, 'cofins'),
      // v1 agrega em contribSociaisRetidas; v2/FILU trazem csll direto.
      csll: numOf(campos, 'csll') + numOf(campos, 'contribSociaisRetidas'),
    },
    reformaTributaria: {
      cbs: numOf(campos, 'cbs'),
      ibsMunicipal: numOf(campos, 'ibsMunicipal'),
      ibsEstadual: numOf(campos, 'ibsEstadual'),
    },
    productTaxes:
      category === 'product'
        ? { icms: numOf(campos, 'icms'), ipi: numOf(campos, 'ipi'), pis: 0, cofins: 0, vTotTrib: 0 }
        : null,
  }
}
