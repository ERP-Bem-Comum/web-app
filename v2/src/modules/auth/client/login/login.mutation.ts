/**
 * loginMutationOptions — data AGNÓSTICA do comportamento login (ADR-0009): a mutation que chama a
 * PORTA (repository → server fn). Objeto puro (mutationKey/mutationFn), sem React — o binding o assina
 * via `useMutation` (React) ou `createMutation` (Solid). Camada = sufixo `.mutation.ts` (lint anti-react).
 */
import { authRepository } from '#modules/auth/client/data/repository/auth.repository.instance.ts'
import type { LoginInput } from '#modules/auth/client/data/model/auth.model.ts'

export const loginMutationOptions = {
  mutationKey: ['auth', 'login'] as const,
  mutationFn: (input: LoginInput) => authRepository.login(input),
}
