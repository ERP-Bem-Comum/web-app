/**
 * Parser do envelope de erro real do core-api.
 * Contrato: { error: { code: string; message: string; requestId?: string } }.
 * Fonte: core-api/src/shared/http/errors.ts:19-35. A discriminação do AppError é por STATUS
 * (ver map-to-app-error), não pelo slug — o `code` chega colapsado num balde público (OWASP API8),
 * e é a `message` PT-BR que carrega o recado ao operador.
 *
 * ⚠️ `requestId` é OPCIONAL de propósito, e a decisão custou uma investigação inteira.
 *
 * O core-api monta o envelope por dois caminhos: o normal (`toErrorEnvelope`, que carimba o
 * `requestId`) e algumas guardas de rota que o montam à mão e o OMITEM. Uma delas recusa a geração de
 * remessa sob `AUTH_RBAC_MODE=bypass` (`financial/adapters/http/plugin.ts:407`): responde 503 com a
 * mensagem exata do que houve — "Geração de remessa indisponível: a autorização por permissão está
 * desligada neste ambiente".
 *
 * Enquanto `requestId` era obrigatório aqui, esse envelope não parseava, a `message` era descartada
 * inteira, e o 503 caía no balde `server` → a tela dizia "Algo deu errado". A frase que explicava o
 * bloqueio chegou no corpo da resposta e foi jogada fora por falta de um campo que NENHUM chamador
 * lê: os ~20 usos de `parseErrorEnvelope` no repositório consomem `error.code` ou `error.message`, e
 * nenhum toca no `requestId`.
 *
 * Exigir um campo só de observabilidade para entregar o campo que fala com o humano é trocar o
 * essencial pelo acessório. `requestId` continua sendo lido quando vem — vira `null` quando não vem.
 */
export type ErrorEnvelope = Readonly<{
  error: Readonly<{ code: string; message: string; requestId: string | null }>
}>

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

export const parseErrorEnvelope = (body: unknown): ErrorEnvelope | null => {
  if (!isRecord(body) || !isRecord(body.error)) return null
  const { code, message, requestId } = body.error
  // `code` e `message` seguem OBRIGATÓRIOS: sem os dois não há envelope de erro do core-api — só um
  // objeto qualquer. Afrouxar aqui faria a camada inventar um erro que o backend não declarou.
  if (typeof code !== 'string' || typeof message !== 'string') return null
  return { error: { code, message, requestId: typeof requestId === 'string' ? requestId : null } }
}
