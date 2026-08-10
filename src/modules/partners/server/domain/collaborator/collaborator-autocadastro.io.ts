/**
 * Autocadastro de Colaborador (#040) — tipos de I/O do domínio (PUROS, sem Zod). A rota PÚBLICA
 * token-based da 2ª fase do cadastro. Os schemas Zod correspondentes vivem na borda
 * (`../../adapters/collaborator-autocadastro.io-schemas.ts`); guards AssertEqual travam o drift.
 *
 * O submit reusa EXATAMENTE os campos do `CompleteCollaboratorRegistrationInput` MENOS o `id` (o
 * backend identifica o colaborador pelo `token`, não por id) — daí `Omit<..., 'id'>`.
 */
import type { CompleteCollaboratorRegistrationInput } from './collaborator.io.ts'

// Preview (GET ?token=): o mínimo p/ a UI dizer "Olá, {name}!" sem vazar dados sensíveis (CPF mascarado).
export type AutocadastroPreview = Readonly<{
  collaboratorId: string
  name: string
  cpfMasked: string
}>

// Submit (POST): token + prova de posse leve (primeiros dígitos do CPF) + os campos da 2ª fase (sem id).
export type AutocadastroSubmitInput = Readonly<
  {
    token: string
    cpfPrefix: string
  } & Omit<CompleteCollaboratorRegistrationInput, 'id'>
>
