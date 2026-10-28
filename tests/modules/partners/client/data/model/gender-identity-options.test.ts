/**
 * Identidade de Gênero (specs 122 e 130) — node:test PURO. O seletor segue a ordem e a redação do cliente;
 * "Queer" entra antes de "Outro" e TRAVESTI fica fora (sem dado gravado — P.O., 23/10).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  GENDER_IDENTITIES,
  GENDER_IDENTITY_OPTIONS,
} from '#modules/partners/client/data/model/collaborator.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

describe('Identidade de Gênero — seletor', () => {
  it('ordem do cliente, com Queer antes de Outro', () => {
    assert.deepEqual(GENDER_IDENTITY_OPTIONS, [
      'MULHER_CIS',
      'HOMEM_CIS',
      'MULHER_TRANS',
      'HOMEM_TRANS',
      'NAO_BINARIO',
      'QUEER',
      'OUTRO',
      'PREFIRO_NAO_RESPONDER',
    ])
  })

  it('TRAVESTI fora do seletor; QUEER também no enum canônico (relatório Equipe conta)', () => {
    assert.ok(!(GENDER_IDENTITY_OPTIONS as readonly string[]).includes('TRAVESTI'))
    assert.ok((GENDER_IDENTITIES as readonly string[]).includes('QUEER'))
  })

  it('rótulos do cliente', () => {
    assert.equal(ptBR['partners.collaborators.gender.MULHER_TRANS'], 'Mulher transgênero / Travesti')
    assert.equal(ptBR['partners.collaborators.gender.QUEER'], 'Queer')
  })
})
