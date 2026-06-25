/**
 * Config de ambiente — SERVER-ONLY. Validada com Zod (fail-fast no boot).
 * `parseEnv` é pura (testável, retorna Result); `loadEnvOrThrow` é a borda de infra
 * que lança no boot se a config for inválida. NUNCA importar de código client/UI
 * nem usar prefixo `VITE_` (não pode ir ao bundle do browser).
 *
 * Contrato de base URLs (ADR-0020): as URLs do core-api são lidas em RUNTIME daqui — trocar o DNS é
 * mudar a env + reiniciar, SEM recompilar (`VITE_*` seria inlined no build → rebuild, e vazaria ao
 * client). O browser fala só com o BFF; mesmo com o core-api público via HTTPS, o client não o chama
 * direto. Base URLs ADICIONAIS (ex.: `CORE_API_V1_URL` — espelho legado, ADR-0033 do core-api) entram
 * aqui no mesmo padrão, quando houver uso.
 *
 * `LOG_LEVEL`/`NODE_ENV` NÃO entram no EnvSchema de propósito: o logger os lê direto de `process.env`
 * (camada mais baixa, precisa funcionar mesmo se a config quebrar — ADR-0014).
 */
import * as z from 'zod';

import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'

const EnvSchema = z.object({
  CORE_API_URL: z.url(),
})

export type EnvConfig = Readonly<z.infer<typeof EnvSchema>>

export const parseEnv = (
  source: Record<string, string | undefined>,
): Result<EnvConfig, readonly string[]> => {
  const parsed = EnvSchema.safeParse(source)
  if (!parsed.success) {
    return err(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`))
  }
  return ok(parsed.data)
}

export const loadEnvOrThrow = (
  source: Record<string, string | undefined> = process.env,
): EnvConfig => {
  const r = parseEnv(source)
  if (isErr(r)) {
    // Borda de infra server-only (boot): fail-fast via throw é legítimo aqui (constituição §II).
    throw new Error(`[env] configuração inválida:\n  - ${r.error.join('\n  - ')}`)
  }
  return r.value
}
