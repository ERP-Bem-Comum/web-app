/**
 * logger — logger estruturado do BFF (SERVER-ONLY). Emite JSON em stdout (destination padrão do pino,
 * via sonic-boom); a infra coleta o stdout. NÃO usa transport/worker-thread — fica bundler-safe no
 * Nitro/Vite (transports fazem require dinâmico em runtime e quebram sob bundle). NUNCA lança.
 *
 * Por que existe (ADR-0014): a arquitetura errors-as-values (ADR-0002) converte toda exceção em
 * `Result.err(...)` na borda — e, sem este logger, o erro ORIGINAL (mensagem/stack) é descartado no
 * `catch`, deixando a produção cega (sintoma: server fn devolve `error: 'server'` sem rastro nenhum).
 * Aqui o detalhe vive no LOG; o `Result` continua carregando só o TIPO do erro para o client.
 *
 * Segurança (constituição §IX — token nunca vaza): `redact` censura chaves sensíveis conhecidas
 * (senha/token/authorization/cookie/email-PII) em qualquer objeto logado. Regra de ouro: logue
 * METADADOS seguros (kind do erro, status, rota, reqId) — nunca o objeto de credencial nem o body
 * cru do core-api. O `redact` é a rede de segurança, não a primeira linha de defesa.
 *
 * Nível: `LOG_LEVEL` (env) tem precedência; senão default por ambiente (prod=info, dev=debug). Lido
 * direto de `process.env` (não passa pelo EnvSchema de propósito): logging é a camada mais baixa e
 * precisa funcionar mesmo se a config estiver quebrada — inclusive para LOGAR que ela quebrou.
 */
import { pino, stdSerializers, stdTimeFunctions } from 'pino'

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const
type LogLevel = (typeof LOG_LEVELS)[number]

const isLogLevel = (v: string | undefined): v is LogLevel =>
  v !== undefined && (LOG_LEVELS as readonly string[]).includes(v)

const isProduction = process.env.NODE_ENV === 'production'

const resolveLevel = (): LogLevel =>
  isLogLevel(process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : isProduction ? 'info' : 'debug'

// Chaves censuradas em QUALQUER objeto logado (token NUNCA deve chegar ao log). Os wildcards `*.x`
// alcançam objetos aninhados (ex.: `{ req: { headers: { authorization } } }`).
const REDACT_PATHS: readonly string[] = [
  'password',
  '*.password',
  'authorization',
  '*.authorization',
  'headers.authorization',
  '*.headers.authorization',
  'cookie',
  '*.cookie',
  'set-cookie',
  '*.set-cookie',
  'token',
  '*.token',
  'accessToken',
  '*.accessToken',
  'refreshToken',
  '*.refreshToken',
  'email', // PII (LGPD) — preferimos perder o e-mail no log a vazá-lo
  '*.email',
  // Segredos/credenciais adicionais (D8/ADR-0019 — MASTG-0022 "data to exclude").
  'secret',
  '*.secret',
  'clientSecret',
  '*.clientSecret',
  'apiKey',
  '*.apiKey',
  'jwt',
  '*.jwt',
  // sessionId é o identificador OPACO de sessão (ADR-0005) — não logar (≠ request_id, que QUEREMOS logar).
  'sessionId',
  '*.sessionId',
]

export const logger = pino({
  level: resolveLevel(),
  base: { service: 'web-app-bff', env: process.env.NODE_ENV ?? 'development' },
  redact: { paths: [...REDACT_PATHS], censor: '[redacted]' },
  serializers: { err: stdSerializers.err }, // Error → { type, message, stack } (sempre logue como `{ err }`)
  formatters: { level: (label) => ({ level: label }) }, // 'error' em vez do código numérico 50
  timestamp: stdTimeFunctions.isoTime,
})
