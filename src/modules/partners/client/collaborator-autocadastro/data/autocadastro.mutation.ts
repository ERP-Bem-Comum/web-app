/**
 * autocadastroSubmitMutationOptions (#040) — data AGNÓSTICA do submit (POST) da rota pública. Objeto puro
 * (mutationKey/mutationFn), SEM React (ADR-0009); o binding o assina via `useMutation`. Chama a PORTA
 * (repository → server fn). Camada = sufixo `.mutation.ts`.
 */
import { autocadastroRepository } from './autocadastro.repository.instance.ts'
import type { AutocadastroSubmitInput } from './autocadastro.repository.ts'

export const autocadastroSubmitMutationOptions = {
  mutationKey: ['collaborator-autocadastro', 'submit'] as const,
  mutationFn: (input: AutocadastroSubmitInput) => autocadastroRepository.submit(input),
}
