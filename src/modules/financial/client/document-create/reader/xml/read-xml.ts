/**
 * read-xml — roteador PURO de XML por leiaute. Detecta o schema por marcador e delega ao parser certo.
 *
 * Ordem importa (mais específico primeiro): NF-e produto e NFS-e SP antes do ABRASF (que só olha
 * `<CodigoVerificacao>`, tag presente também no XML de SP). Sem marcador conhecido → nacional (o dominante com
 * a padronização federal). Entrada vazia → `null` (§II: degrada, não lança).
 */
import type { DocumentReading } from '../document-reading.model.ts'
import { parseNfseNational } from './nfse-national.reader.ts'
import { parseNfseAbrasf, isAbrasf } from './nfse-abrasf.reader.ts'
import { parseNfseSaoPaulo, isSaoPaulo } from './nfse-sao-paulo.reader.ts'
import { parseNfeProduto, isNfeProduto } from './nfe-produto.reader.ts'

export const readXml = (xml: string): DocumentReading | null => {
  if (xml.trim() === '') return null
  if (isNfeProduto(xml)) return parseNfeProduto(xml) // NF-e produto (modelo 55)
  if (isSaoPaulo(xml)) return parseNfseSaoPaulo(xml) // NFS-e São Paulo
  if (isAbrasf(xml)) return parseNfseAbrasf(xml) // ABRASF/ginfes (Fortaleza)
  return parseNfseNational(xml) // NFS-e nacional (sped.fazenda)
}
