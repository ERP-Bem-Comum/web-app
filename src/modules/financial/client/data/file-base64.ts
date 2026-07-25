/**
 * File → base64 (nativo `btoa`) — helper de UPLOAD binário do Financeiro (client/data). Confina a leitura do
 * `File` no browser; a fronteira (server-fn / core-api) recebe só strings. Reusado pela ingestão por OCR do
 * "Lançar Documento" (#62) e pela importação de extrato em PDF da Conciliação (core-api#557). PURO (só depende
 * do `File` nativo). Erros de leitura propagam ao chamador (que os trata como valor).
 */
import type { SourceFileInput } from './model/document.model.ts'

export const fileToBase64 = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  for (const byte of bytes) bin += String.fromCharCode(byte)
  return btoa(bin)
}

/**
 * base64 → bytes (nativo `atob`). PURA. Usada p/ reconstruir o comprovante-fonte (core-api#568) que a
 * server-fn trouxe como base64 → o client monta um `File`/blob e renderiza (reusa o web view do OCR).
 */
export const base64ToBytes = (base64: string): Uint8Array => {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** base64 + nome + mimeType → `File` (browser). O `type` alimenta o web view (PDF/XML). PURA (nativo). */
export const base64ToFile = (base64: string, fileName: string, mimeType: string): File =>
  // `as BlobPart`: Uint8Array é um BlobPart válido em runtime; o cast só satisfaz a tipagem estrita do lib
  // DOM (Uint8Array<ArrayBufferLike> vs ArrayBufferView<ArrayBuffer>) — mesmo motivo do `octet-stream-fetch`.
  new File([base64ToBytes(base64) as unknown as BlobPart], fileName, { type: mimeType })

// #577: mimeType do comprovante — aceita por MIME OU extensão (nunca só `File.type`, que vem vazio/errado em
// alguns SOs — lição do PDF de MIME quebrado). Fora da allowlist (pdf/xml) → null (não anexa).
type SourceMime = SourceFileInput['mimeType']
const SOURCE_MIME_ALLOWLIST: readonly SourceMime[] = ['application/pdf', 'text/xml', 'application/xml']
const sourceMimeFromName = (fileName: string): SourceMime | null => {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.xml')) return 'text/xml'
  return null
}

/**
 * File → `SourceFileInput` (#577): resolve o mimeType (por `File.type` na allowlist OU pela extensão) e
 * base64-encoda os bytes, p/ o comprovante viajar JUNTO no create atômico (`/documents/with-source-file`).
 * Fora da allowlist (nem PDF nem XML) → null (o documento é salvo sem anexo). PURA (só `File` nativo).
 */
export const fileToSourceFileInput = async (file: File): Promise<SourceFileInput | null> => {
  const typed = SOURCE_MIME_ALLOWLIST.includes(file.type as SourceMime) ? (file.type as SourceMime) : null
  const mimeType = typed ?? sourceMimeFromName(file.name)
  if (mimeType === null) return null
  return { fileName: file.name, mimeType, base64: await fileToBase64(file) }
}
