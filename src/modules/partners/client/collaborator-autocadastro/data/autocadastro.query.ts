/**
 * autocadastroPreviewQueryOptions (#040) — data AGNÓSTICA do preview (GET) da rota pública. Objeto puro
 * (queryKey/queryFn), SEM React (ADR-0009, lint anti-react); o binding o assina via `useQuery`. O preview
 * hidrata o cabeçalho ("Olá, {name}!") e habilita o form. `enabled` fica com o binding (só busca com token).
 * Camada = sufixo `.query.ts`.
 */
import { autocadastroRepository } from './autocadastro.repository.instance.ts'

export const autocadastroPreviewQueryOptions = (token: string) => ({
  queryKey: ['collaborator-autocadastro', 'preview', token] as const,
  queryFn: () => autocadastroRepository.preview(token),
  // Token uso-único: não revalida em foco/reconnect (evita 404 espúrio após o submit invalidar o token).
  staleTime: Number.POSITIVE_INFINITY,
  retry: false,
})
