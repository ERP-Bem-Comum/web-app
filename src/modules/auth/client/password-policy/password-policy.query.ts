/**
 * Query options da política de senha (#32) — AGNÓSTICO (puro). Sobre o gateway (GET /auth/password-policy).
 * `staleTime: Infinity`: a política praticamente não muda durante a sessão. `null` em falha → o binding
 * aplica o fallback {12,128} (D4). Reutilizável por qualquer fluxo que peça senha (FR-007).
 */
import { fetchPasswordPolicy } from '#modules/auth/client/data/gateways/password-policy.gateway.ts'

export const passwordPolicyQueryKey = ['auth', 'password-policy'] as const

export const passwordPolicyQueryOptions = {
  queryKey: passwordPolicyQueryKey,
  queryFn: () => fetchPasswordPolicy(),
  staleTime: Infinity,
}
