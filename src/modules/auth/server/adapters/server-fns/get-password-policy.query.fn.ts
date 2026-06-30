/**
 * get-password-policy — server function (leitura) da política pública de senha (#32).
 * GET /api/v2/auth/password-policy (sem auth). Devolve a política ou `null` (degrada como o
 * getCurrentUserFn): o client aplica o fallback {12,128} quando vier null. Sem throw fora da borda.
 */
import { createServerFn } from '@tanstack/react-start'

import { isOk } from '#shared/primitives/result.ts'
import { authServer } from '#modules/auth/server/adapters/auth.composition.ts'
import type { PasswordPolicy } from '#modules/auth/server/domain/session/session.types.ts'

export const getPasswordPolicyFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PasswordPolicy | null> => {
    const r = await authServer().getPasswordPolicy()
    return isOk(r) ? r.value : null
  },
)
