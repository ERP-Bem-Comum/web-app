/**
 * Instância da AutocadastroRepository (#040) — wire das 2 server functions reais expostas pelo
 * `public-api` do módulo (boundary §I: o client consome a fronteira, não o server/domain). Espelha
 * `collaborator.repository.instance.ts`. As fns já existem no BFF; nada novo no servidor.
 */
import { autocadastroPreviewFn, autocadastroSubmitFn } from '#modules/partners/public-api/index.ts'

import { createAutocadastroRepository } from './autocadastro.repository.ts'

export const autocadastroRepository = createAutocadastroRepository({
  autocadastroPreviewFn: (opts) => autocadastroPreviewFn(opts),
  autocadastroSubmitFn: (opts) => autocadastroSubmitFn(opts),
})
