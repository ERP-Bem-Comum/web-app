/**
 * Use-cases do Autocadastro de Colaborador (#040) — a rota PÚBLICA token-based da 2ª fase. Thin sobre a
 * borda; sem I/O direto (o client público é injetado). Result em tudo (§II), sem throw. O `Client` é uma
 * porta — implementada em adapters (`core-api-collaborator-autocadastro.ts`). NÃO recebe token de sessão:
 * a autenticação é pelo `token` do link + os primeiros dígitos do CPF (dentro do próprio input).
 */
import type { Result } from '#shared/primitives/result.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type {
  AutocadastroPreview,
  AutocadastroSubmitInput,
} from '#modules/partners/server/domain/collaborator/collaborator-autocadastro.io.ts'

export type AutocadastroClient = Readonly<{
  preview: (token: string) => Promise<Result<AutocadastroPreview, PartnersError>>
  submit: (input: AutocadastroSubmitInput) => Promise<Result<void, PartnersError>>
}>

type Deps = Readonly<{ client: AutocadastroClient }>

export const createAutocadastroPreview =
  (deps: Deps) =>
  (token: string): Promise<Result<AutocadastroPreview, PartnersError>> =>
    deps.client.preview(token)

export const createAutocadastroSubmit =
  (deps: Deps) =>
  (input: AutocadastroSubmitInput): Promise<Result<void, PartnersError>> =>
    deps.client.submit(input)
