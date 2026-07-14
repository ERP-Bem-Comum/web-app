/**
 * nfse-sao-paulo.reader — parser PURO do XML da NFS-e da Prefeitura de São Paulo (schema próprio). Legado:
 * novas notas migram para o nacional. Saída em `DocumentReading`. Em SP o ISS só é RETIDO quando `ISSRetido=true`.
 */
import type { DocumentReading } from '../document-reading.model.ts'
import { parseXml, deep, num, str, dataISO, competenceBR } from './xml-utils.ts'

/** true se é o XML da NFS-e de São Paulo. */
export const isSaoPaulo = (xml: string): boolean =>
  /<NumeroNFe>/i.test(xml) || /<RazaoSocialPrestador>/i.test(xml)

export const parseNfseSaoPaulo = (xml: string): DocumentReading => {
  const root = parseXml(xml, false)
  const nfe = deep(root, 'NFe') ?? root
  const issRetido = /^(true|1|sim)$/i.test(str(deep(nfe, 'ISSRetido')) ?? 'false')
  const valorIss = num(deep(nfe, 'ValorISS'))
  const prestDoc = deep(nfe, 'CPFCNPJPrestador') ?? {}

  return {
    kind: 'NFS-e',
    category: 'service',
    number: str(deep(nfe, 'NumeroNFe')),
    series: str(deep(deep(nfe, 'ChaveRPS') ?? {}, 'SerieRPS')),
    competence: competenceBR(deep(nfe, 'DataFatoGeradorNFe') ?? deep(nfe, 'DataEmissaoNFe')),
    issueDate: dataISO(deep(nfe, 'DataEmissaoNFe')),
    grossValue: num(deep(nfe, 'ValorServicos')),
    description: str(deep(nfe, 'Discriminacao')),
    accessKey: str(deep(nfe, 'CodigoVerificacao')),
    supplier: {
      taxId: str(deep(prestDoc, 'CNPJ') ?? deep(prestDoc, 'CPF')),
      name: str(deep(nfe, 'RazaoSocialPrestador')),
    },
    retentions: {
      iss: issRetido ? valorIss : 0, // SP: só retido quando ISSRetido=true
      irrf: 0,
      inss: 0,
      pis: 0,
      cofins: 0,
      csll: 0,
    },
    reformaTributaria: { cbs: 0, ibsMunicipal: 0, ibsEstadual: 0 },
    productTaxes: null,
  }
}
