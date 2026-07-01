/**
 * Schemas Zod de I/O do Autocadastro (#040) — vivem na BORDA (adapters), não no domínio. Os tipos
 * correspondentes são escritos à mão em `../domain/collaborator/collaborator-autocadastro.io.ts`; guards
 * AssertEqual travam o drift. O submit reusa o `CompleteCollaboratorRegistrationInputSchema` MENOS o `id`
 * (o backend identifica pelo token) + `token` + `cpfPrefix` (prova de posse leve: só-dígitos, 3..14).
 */
import * as z from 'zod'

import type * as D from '../domain/collaborator/collaborator-autocadastro.io.ts'
import { CompleteCollaboratorRegistrationInputSchema } from './collaborator.io-schemas.ts'

export const AutocadastroPreviewInputSchema = z.object({
  token: z.string().trim().min(1),
})

export const AutocadastroSubmitInputSchema = CompleteCollaboratorRegistrationInputSchema.omit({
  id: true,
}).extend({
  token: z.string().trim().min(1),
  // primeiros dígitos do CPF — só-dígitos, ≥3 e ≤14 (o CPF tem 11; teto folgado). FR-002/US2.
  cpfPrefix: z
    .string()
    .trim()
    .regex(/^\d{3,14}$/),
})

type AssertEqual<A, B> = [A] extends [B] ? true : never

// Preview não tem tipo de INPUT no domínio (a porta recebe só o `token: string`); o schema é a borda.
const _g_submit: AssertEqual<z.infer<typeof AutocadastroSubmitInputSchema>, D.AutocadastroSubmitInput> = true

void [_g_submit]
