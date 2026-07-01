/**
 * autocadastroViewModel — ViewModel AGNÓSTICO do Autocadastro (#040; objeto puro; ADR-0009, §XI).
 * ZERO React (lint anti-react) → testável em node:test. O binding (`autocadastro.binding.ts`) o liga ao
 * framework (useQuery/useMutation).
 *
 * Expõe:
 * - `derivePageState(...)`: união discriminada + switch → 'invalid' | 'loading' | 'ready'. A página só
 *   mostra o form quando 'ready' (tem preview). Token ausente OU preview error 'autocadastro-invalid' →
 *   'invalid' (sem form, anti-enumeração).
 * - `canSubmit(cpfPrefix)`: gate PURO do botão — cpfPrefix só-dígitos com length ≥ 3.
 * - `onlyDigits(raw)`: normaliza o cpfPrefix (o form envia só os dígitos ao submit).
 * - `toErrorTag(error)`: PartnersError → tag i18n via `partnersErrorTag` (§V).
 * - `previewQuery` / `submitMutation`: options puras (query/mutation) que o binding assina.
 */
import type { Result } from '#shared/primitives/result.ts'
import { isErr } from '#shared/primitives/result.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'
import type { AutocadastroPreview } from '#modules/partners/public-api/index.ts'

import { autocadastroPreviewQueryOptions } from '../data/autocadastro.query.ts'
import { autocadastroSubmitMutationOptions } from '../data/autocadastro.mutation.ts'

/** Estado da PÁGINA (união discriminada, §IV). O switch exaustivo garante que todo caso é tratado. */
export type AutocadastroPageState =
  | Readonly<{ status: 'invalid' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'ready'; preview: AutocadastroPreview }>

/** Entradas puras da derivação (o binding traduz o estado do `useQuery` para isto). */
export type AutocadastroPreviewSnapshot = Readonly<{
  /** Token do link (null/'' → estado 'invalid', sem nem buscar). */
  token: string | null
  /** A query ainda está em voo? */
  pending: boolean
  /** O Result do preview (undefined enquanto não resolveu). */
  result: Result<AutocadastroPreview, PartnersError> | undefined
}>

const MIN_CPF_PREFIX = 3

/** Extrai apenas os dígitos (o cpfPrefix aceita com/sem máscara; o server valida 3–14 dígitos). */
const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')

export const autocadastroViewModel = {
  previewQuery: autocadastroPreviewQueryOptions,
  submitMutation: autocadastroSubmitMutationOptions,

  onlyDigits,

  /**
   * Deriva o estado da página a partir do snapshot do preview (PURO). Token ausente → 'invalid' sem
   * buscar; preview 'autocadastro-invalid' (404) → 'invalid'; qualquer outro erro/loading → 'loading'
   * (a página nunca mostra o form sem preview); ok → 'ready' com o preview.
   */
  derivePageState: (snapshot: AutocadastroPreviewSnapshot): AutocadastroPageState => {
    if (snapshot.token === null || snapshot.token.trim() === '') return { status: 'invalid' }

    const res = snapshot.result
    if (res === undefined) return { status: 'loading' }

    if (isErr(res)) {
      // Só o erro de link é terminal (sem form). Conectividade/servidor caem no 'loading' e o binding
      // pode reportar a falha por outro canal; a página, sem preview, não habilita o form.
      return res.error === 'autocadastro-invalid' ? { status: 'invalid' } : { status: 'loading' }
    }

    return { status: 'ready', preview: res.value }
  },

  /** Gate PURO do botão "Concluir cadastro": cpfPrefix só-dígitos com length ≥ 3. */
  canSubmit: (cpfPrefix: string): boolean => onlyDigits(cpfPrefix).length >= MIN_CPF_PREFIX,

  /** PartnersError → tag i18n (§V: a UI trata só a tag, nunca status HTTP). */
  toErrorTag: (error: PartnersError): string => partnersErrorTag(error),
} as const
