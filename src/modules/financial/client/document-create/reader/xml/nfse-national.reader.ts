/**
 * nfse-national.reader — parser PURO da NFS-e NACIONAL (DANFSe v1.0, com DPS/infNFSe). Fonte de precisão máxima:
 * cada valor já rotulado no XML (RFB / Ambiente de Dados Nacional). Saída em `DocumentReading`.
 *
 * O leiaute nacional tem valores em dois níveis: `infNFSe.valores` (vLiq) e `DPS...valores` (vServ). Retenções
 * federais em `trib.tribFed`, ISS em `trib.tribMun`, Reforma Tributária em `trib.IBSCBS` (ausente no Simples/MEI).
 */
import type { DocumentReading } from '../document-reading.model.ts'
import { parseXml, pick, num, str, competenceBR, dataISO } from './xml-utils.ts'

export const parseNfseNational = (xml: string): DocumentReading => {
  const root = parseXml(xml, true)

  const nfse = pick(root, 'NFSe', 'nfseProc.NFSe', 'NfseProc.NFSe')
  const infNFSe = pick(nfse, 'infNFSe') ?? {}

  // DPS = Declaração de Prestação de Serviço (dados originais da nota).
  const infDPS = pick(infNFSe, 'DPS.infDPS') ?? pick(nfse, 'DPS.infDPS') ?? pick(root, 'DPS.infDPS') ?? {}

  const emit = pick(infNFSe, 'emit') ?? {}
  const prest = pick(infDPS, 'prest') ?? {}
  const serv = pick(infDPS, 'serv') ?? {}

  const valoresDPS = pick(infDPS, 'valores') ?? {}
  const valores = pick(infNFSe, 'valores') ?? {}

  const tribFed = pick(valoresDPS, 'trib.tribFed') ?? {}
  const tribMun = pick(valoresDPS, 'trib.tribMun') ?? {}
  const ibscbs = pick(valoresDPS, 'trib.IBSCBS') ?? {}

  const accessKey = str(pick(infNFSe, '@_Id'))?.replace(/^NFS?e?/i, '') ?? null

  return {
    kind: 'NFS-e',
    category: 'service',
    number: str(pick(infNFSe, 'nNFSe') ?? pick(infDPS, 'nDPS')),
    series: str(pick(infDPS, 'serie')),
    competence: competenceBR(pick(infDPS, 'dCompet', 'competencia')),
    issueDate: dataISO(pick(infDPS, 'dhEmi') ?? pick(infNFSe, 'dhProc')),
    grossValue: num(pick(valoresDPS, 'vServPrest.vServ') ?? pick(valores, 'vLiq')),
    description: str(pick(serv, 'cServ.xDescServ') ?? pick(serv, 'xDescServ')),
    accessKey,
    supplier: {
      taxId: str(pick(emit, 'CNPJ', 'CPF') ?? pick(prest, 'CNPJ', 'CPF')),
      name: str(pick(emit, 'xNome')),
    },
    retentions: {
      iss: num(pick(tribMun, 'vISSQNRet', 'vRetISS')),
      irrf: num(pick(tribFed, 'vRetIRRF')),
      inss: num(pick(tribFed, 'vRetCP')), // contribuição previdenciária retida
      pis: num(pick(tribFed, 'piscofins.vRetPIS', 'vRetPIS')),
      cofins: num(pick(tribFed, 'piscofins.vRetCofins', 'vRetCofins')),
      csll: num(pick(tribFed, 'vRetCSLL')),
    },
    reformaTributaria: {
      cbs: num(pick(ibscbs, 'CBS.vCBS', 'vCBS')),
      ibsMunicipal: num(pick(ibscbs, 'IBSMun.vIBSMun', 'vIBSMun')),
      ibsEstadual: num(pick(ibscbs, 'IBSUF.vIBSUF', 'vIBSEstadual')),
    },
    productTaxes: null,
  }
}
