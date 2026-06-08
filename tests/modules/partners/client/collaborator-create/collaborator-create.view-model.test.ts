/**
 * View-model da criação de colaborador — mapeamento de erro → tag i18n (§V). Puro (node:test).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { collaboratorCreateViewModel } from '#modules/partners/client/collaborator-create/collaborator-create.view-model.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'

describe('collaboratorCreateViewModel.toErrorTag', () => {
  const cases: readonly (readonly [PartnersError, string])[] = [
    ['validation', 'partners.error.validation'],
    ['conflict', 'partners.error.conflict'],
    ['unauthorized', 'partners.error.unauthorized'],
    ['forbidden', 'partners.error.forbidden'],
    ['connectivity', 'partners.error.connectivity'],
    ['server', 'partners.error.server'],
  ]

  for (const [error, tag] of cases) {
    it(`${error} → ${tag}`, () => {
      assert.equal(collaboratorCreateViewModel.toErrorTag(error), tag)
    })
  }

  it('unexpectedErrorTag é a tag genérica de servidor', () => {
    assert.equal(collaboratorCreateViewModel.unexpectedErrorTag, 'partners.error.server')
  })
})
