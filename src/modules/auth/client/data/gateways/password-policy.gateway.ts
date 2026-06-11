/**
 * Gateway client p/ a política de senha (#32) — a porta que chama a server fn `getPasswordPolicyFn`.
 * Fica em client/data (única camada client que toca server/adapters). Devolve a política ou `null`
 * (o binding aplica o fallback {12,128}). Espelha `current-user.gateway.ts`.
 */
import { getPasswordPolicyFn } from '#modules/auth/server/adapters/server-fns/get-password-policy.query.fn.ts'
import type { PasswordPolicy } from '#modules/auth/client/data/model/auth.model.ts'

export const fetchPasswordPolicy = (): Promise<PasswordPolicy | null> => getPasswordPolicyFn()
