/**
 * nfe-produto.reader — parser PURO do XML da NF-e de PRODUTO (modelo 55, leiaute nacional SEFAZ). Schema
 * estabelecido e padronizado. Saída em `DocumentReading` (category `product`) com impostos de produto.
 */
import type { DocumentReading } from '../document-reading.model.ts'
import { parseXml, deep, asArray, num, str, dataISO } from './xml-utils.ts'

/** true se é XML de NF-e de produto (modelo 55). */
export const isNfeProduto = (xml: string): boolean =>
  /portalfiscal\.inf\.br\/nfe/i.test(xml) || /<infNFe\b/i.test(xml)

export const parseNfeProduto = (xml: string): DocumentReading => {
  const root = parseXml(xml, true)
  const inf = deep(root, 'infNFe') ?? {}
  const ide = deep(inf, 'ide') ?? {}
  const emit = deep(inf, 'emit') ?? {}
  const tot = deep(inf, 'ICMSTot') ?? {}

  // Descrição: nome do(s) produto(s).
  const description =
    asArray(deep(inf, 'det'))
      .map((d) => str(deep(d, 'xProd')))
      .filter((s): s is string => s !== null)
      .join('; ') || null

  const id = str(deep(inf, '@_Id')) ?? ''
  const accessKey = id.replace(/\D/g, '') || null

  // NF-e de produto não tem retenções de serviço; valor bruto = total da nota (vNF) ou dos produtos (vProd).
  const total = num(deep(tot, 'vNF'))
  const products = num(deep(tot, 'vProd'))

  return {
    kind: 'NF-e',
    category: 'product',
    number: str(deep(ide, 'nNF')),
    series: str(deep(ide, 'serie')),
    competence: null,
    issueDate: dataISO(deep(ide, 'dhEmi')),
    grossValue: total > 0 ? total : products,
    description,
    accessKey,
    supplier: {
      taxId: str(deep(emit, 'CNPJ') ?? deep(emit, 'CPF')),
      name: str(deep(emit, 'xNome')),
    },
    retentions: { iss: 0, irrf: 0, inss: 0, pis: 0, cofins: 0, csll: 0 },
    reformaTributaria: { cbs: 0, ibsMunicipal: 0, ibsEstadual: 0 },
    productTaxes: {
      icms: num(deep(tot, 'vICMS')),
      ipi: num(deep(tot, 'vIPI')),
      pis: num(deep(tot, 'vPIS')),
      cofins: num(deep(tot, 'vCOFINS')),
      vTotTrib: num(deep(tot, 'vTotTrib')),
    },
  }
}
