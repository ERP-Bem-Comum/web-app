/**
 * requestPasswordResetMutationOptions — data AGNÓSTICA do "Esqueci Minha Senha" (ADR-0009): a mutation
 * que chama a PORTA (repository → server fn). Objeto puro (mutationKey/mutationFn), sem React — o binding
 * o assina via `useMutation`. Camada = sufixo `.mutation.ts` (lint anti-react).
 */
import { authRepository } from '#modules/auth/client/data/repository/auth.repository.instance.ts'
import type { ForgotPasswordInput } from '#modules/auth/client/data/model/auth.model.ts'

export const requestPasswordResetMutationOptions = {
  mutationKey: ['auth', 'forgot-password'] as const,
  mutationFn: (input: ForgotPasswordInput) => authRepository.requestPasswordReset(input),
}
