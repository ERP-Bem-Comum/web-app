/**
 * View-model do anexo de documento assinado — mapeamento de erro → tag i18n (cadeia §V).
 * Garante que os erros específicos do fluxo (invalid-pdf, no-signed-document, etc.) viram a tag certa.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { attachSignedDocumentViewModel } from '#modules/contracts/client/contract-attach-document/attach-signed-document.view-model.ts'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'

describe('attachSignedDocumentViewModel.toErrorTag', () => {
  const cases: readonly (readonly [ContractsError, string])[] = [
    ['invalid-pdf', 'contracts.attach.error.invalid-pdf'],
    ['file-too-large', 'contracts.attach.error.too-large'],
    ['invalid-signed-at', 'contracts.attach.error.invalid-date'],
    ['no-signed-document', 'contracts.attach.error.no-document'],
    ['document-conflict', 'contracts.attach.error.conflict'],
    ['storage-unavailable', 'contracts.attach.error.storage'],
    ['server', 'contracts.error.unexpected'],
    ['unauthorized', 'contracts.error.unauthorized'],
  ]

  for (const [error, tag] of cases) {
    it(`${error} → ${tag}`, () => {
      assert.equal(attachSignedDocumentViewModel.toErrorTag(error), tag)
    })
  }

  it('unexpectedErrorTag é a tag de falha do fluxo', () => {
    assert.equal(attachSignedDocumentViewModel.unexpectedErrorTag, 'contracts.attach.error.failed')
  })
})
