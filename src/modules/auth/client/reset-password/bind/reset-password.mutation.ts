/**
 * resetPasswordMutationOptions — data AGNÓSTICA do "Redefinir Senha" (#038, ADR-0009): a mutation que
 * chama a PORTA (repository → server fn). Objeto puro (mutationKey/mutationFn), sem React — o binding
 * o assina via `useMutation`. Camada = sufixo `.mutation.ts` (lint anti-react).
 */
import { authRepository } from '#modules/auth/client/data/repository/auth.repository.instance.ts'
import type { ResetPasswordInput } from '#modules/auth/client/data/model/auth.model.ts'

export const resetPasswordMutationOptions = {
  mutationKey: ['auth', 'reset-password'] as const,
  mutationFn: (input: ResetPasswordInput) => authRepository.resetPassword(input),
}
