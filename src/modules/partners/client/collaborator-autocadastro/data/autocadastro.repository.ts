/**
 * AutocadastroRepository (#040) — porta do client para o BFF da rota PÚBLICA token-based (2ª fase do
 * cadastro do colaborador). Converte o `{ ok, data|error }` das 2 server fns → `Result` (§II). O client
 * NÃO compõe (§III): cada fn já entrega a resposta completa. Fns injetadas (testável sem o RPC real).
 *
 * - `preview(token)`  → GET  → `AutocadastroPreview` | `PartnersError` (404 → 'autocadastro-invalid').
 * - `submit(input)`   → POST → void ok | `PartnersError` (400 → 'autocadastro-cpf-mismatch', form
 *   preservado; 404 → 'autocadastro-invalid').
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'
import type { AutocadastroPreview, AutocadastroSubmitInput } from '#modules/partners/public-api/index.ts'

// Re-export dos tipos de I/O p/ as camadas irmãs da feature (options/controller) sem que elas toquem o
// public-api direto (boundary: client-data-options só depende de client-data/domain da própria feature).
export type { AutocadastroPreview, AutocadastroSubmitInput }

// A forma RPC das 2 fns (a de submit é `{ ok: true }` sem `data`). Espelha os `*FnResult` do server.
type PreviewFn = (opts: {
  data: { token: string }
}) => Promise<
  Readonly<{ ok: true; data: AutocadastroPreview }> | Readonly<{ ok: false; error: PartnersError }>
>
type SubmitFn = (opts: {
  data: AutocadastroSubmitInput
}) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; error: PartnersError }>>

export type AutocadastroRepository = Readonly<{
  preview: (token: string) => Promise<Result<AutocadastroPreview, PartnersError>>
  submit: (input: AutocadastroSubmitInput) => Promise<Result<void, PartnersError>>
}>

export const createAutocadastroRepository = (
  deps: Readonly<{
    autocadastroPreviewFn: PreviewFn
    autocadastroSubmitFn: SubmitFn
  }>,
): AutocadastroRepository => ({
  preview: async (token) => {
    const res = await deps.autocadastroPreviewFn({ data: { token } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  submit: async (input) => {
    const res = await deps.autocadastroSubmitFn({ data: input })
    return res.ok ? ok(undefined) : err(res.error)
  },
})
