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
