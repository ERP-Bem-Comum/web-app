/**
 * nfse-abrasf.reader — parser PURO do XML no schema ABRASF/ginfes (ex.: Fortaleza). Legado: com a padronização
 * federal, novas notas vêm no leiaute nacional. Saída no MESMO `DocumentReading`.
 *
 * `<CodigoVerificacao>` é exclusivo do ABRASF (o nacional usa `<infNFSe>`) — usado como marcador de detecção.
 */
import type { DocumentReading } from '../document-reading.model.ts'
import { parseXml, deep, num, str, competenceBR, dataISO } from './xml-utils.ts'

/** true se o XML é ABRASF/ginfes (e NÃO o leiaute nacional). */
export const isAbrasf = (xml: string): boolean =>
  /ginfes\.com\.br/i.test(xml) || /<CodigoVerificacao\b/i.test(xml)

export const parseNfseAbrasf = (xml: string): DocumentReading => {
  const root = parseXml(xml, false)
  const inf = deep(root, 'InfNfse') ?? {}
  const valores = deep(inf, 'Valores') ?? {}
  const prest = deep(inf, 'PrestadorServico') ?? {}

  return {
    kind: 'NFS-e',
    category: 'service',
    number: str(deep(inf, 'Numero')),
    series: null, // ABRASF não traz série no InfNfse
    competence: competenceBR(deep(inf, 'Competencia')),
    issueDate: dataISO(deep(inf, 'DataEmissao')),
    grossValue: num(deep(valores, 'ValorServicos')),
    description: str(deep(inf, 'Discriminacao')),
    accessKey: str(deep(inf, 'ChaveAcesso')),
    supplier: {
      taxId: str(deep(prest, 'Cnpj') ?? deep(prest, 'Cpf')),
      name: str(deep(prest, 'RazaoSocial') ?? deep(prest, 'NomeFantasia')),
    },
    retentions: {
      // ValorIssRetido já é o valor RETIDO (0 quando não retido).
      iss: num(deep(valores, 'ValorIssRetido')),
      irrf: num(deep(valores, 'ValorIr')),
      inss: num(deep(valores, 'ValorInss')),
      pis: num(deep(valores, 'ValorPis')),
      cofins: num(deep(valores, 'ValorCofins')),
      csll: num(deep(valores, 'ValorCsll')),
    },
    reformaTributaria: { cbs: 0, ibsMunicipal: 0, ibsEstadual: 0 },
    productTaxes: null,
  }
}
