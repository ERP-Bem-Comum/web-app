/**
 * Modelo da INGESTÃO de documento por OCR (Lançar Documento, core-api#62). O endpoint real cria um RASCUNHO
 * pré-preenchido e devolve `{ documentId, resolvedVia }` — os campos extraídos ficam no rascunho (não voltam
 * inline). O fluxo do client, no sucesso, abre esse rascunho em modo edição p/ o operador revisar e confirmar.
 * Erros como valores (§II): `OcrError` espelha 1:1 o union da server-fn.
 */

// Resultado da ingestão: id do rascunho criado + como o backend resolveu a extração.
export type OcrIngestResult = Readonly<{
  documentId: string
  resolvedVia: 'xml' | 'native-text' | null
}>

// Erros do fluxo de ingestão (valores; sem throw). `invalid-mime`/`invalid-file` barrados na borda (Zod + magic);
// `file-too-large` = > 20 MiB; `unauthorized` = sem sessão/token; `server` = falha do backend/conectividade.
export type OcrError = 'invalid-mime' | 'file-too-large' | 'invalid-file' | 'unauthorized' | 'server'
