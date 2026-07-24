/**
 * File → base64 (nativo `btoa`) — helper de UPLOAD binário do Financeiro (client/data). Confina a leitura do
 * `File` no browser; a fronteira (server-fn / core-api) recebe só strings. Reusado pela ingestão por OCR do
 * "Lançar Documento" (#62) e pela importação de extrato em PDF da Conciliação (core-api#557). PURO (só depende
 * do `File` nativo). Erros de leitura propagam ao chamador (que os trata como valor).
 */
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
