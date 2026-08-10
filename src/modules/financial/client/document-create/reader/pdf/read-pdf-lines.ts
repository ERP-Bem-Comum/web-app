/**
 * read-pdf-lines — PURO: `Line[]` (já extraídas da camada de texto do PDF) → `DocumentReading`. Detecta o
 * gabarito e traduz o `campos` cru (chaves do gabarito) para o modelo unificado.
 *
 * Emitente: os gabaritos DANFSe (v1/v2) extraem o CNPJ/CPF do prestador (`supplierCnpj`) → `supplier.taxId`
 * habilita o casamento por CNPJ (auto-seleção do fornecedor). Gabaritos sem o campo → `supplier` vazio (o
 * casamento fica só no XML). A DANFSe v1 agrega PIS+COFINS+CSLL em
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

// Descrição do Serviço (texto livre multi-linha) → uma linha: colapsa quebras/espaços e limita a 500 (teto do
// backend, evita reprovar o save). null quando o gabarito não a extrai.
const DESCRIPTION_MAX = 500
const descriptionOf = (campos: Readonly<Record<string, FieldValue>>): string | null => {
  const raw = strOf(campos, 'descricao')
  if (raw === null) return null
  const clean = raw.replace(/\s+/g, ' ').trim()
  return clean === '' ? null : clean.slice(0, DESCRIPTION_MAX)
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
    description: descriptionOf(campos),
    accessKey: strOf(campos, 'chaveAcesso'),
    // CNPJ/CPF do emitente quando o gabarito o extrai (DANFSe v1/v2) → habilita a auto-seleção do fornecedor
    // (matchPartnerByTaxId normaliza a pontuação). Gabaritos sem o campo → null (comportamento anterior).
    supplier: { taxId: strOf(campos, 'supplierCnpj'), name: null },
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
