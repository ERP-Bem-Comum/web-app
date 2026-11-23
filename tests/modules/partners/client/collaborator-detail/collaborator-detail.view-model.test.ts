import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  activationSubtitleKeys,
  deactivationReasonOptions,
  parseDeactivationReason,
  statusActionFor,
} from '../../../../../src/modules/partners/client/collaborator-detail/collaborator-detail.view-model.ts'

describe('collaborator-detail.view-model — inativar/reativar (spec 133)', () => {
  it('statusActionFor: ativo → inativar; inativo → reativar', () => {
    assert.equal(statusActionFor('active'), 'deactivate')
    assert.equal(statusActionFor('inactive'), 'reactivate')
  })

  it('motivos = os 4 do core-api, sem o marcador LEGACY_MIGRATION', () => {
    assert.deepEqual(
      [...deactivationReasonOptions],
      ['DESLIGAMENTO_ABC', 'FALECIMENTO', 'TEMPO_CONTRATO_FINALIZADO', 'SOLICITACAO_RESCISAO_CONTRATUAL'],
    )
  })

  it('parseDeactivationReason: vazio/desconhecido → null (Confirmar bloqueado); válido → motivo', () => {
    assert.equal(parseDeactivationReason(''), null)
    assert.equal(parseDeactivationReason('LEGACY_MIGRATION'), null)
    assert.equal(parseDeactivationReason('FALECIMENTO'), 'FALECIMENTO')
  })

  it('activationSubtitleKeys: ativo não mostra nada; inativo mostra o status e, se houver, o motivo', () => {
    assert.deepEqual(activationSubtitleKeys({ activation: 'active' }), [])
    assert.deepEqual(activationSubtitleKeys({ activation: 'inactive' }), [
      'partners.collaborators.status.inactive',
    ])
    assert.deepEqual(
      activationSubtitleKeys({ activation: 'inactive', deactivationReason: 'DESLIGAMENTO_ABC' }),
      [
        'partners.collaborators.status.inactive',
        // eslint-disable-next-line no-secrets/no-secrets -- chave i18n (código de enum), não é segredo
        'partners.collaborators.deactivationReason.DESLIGAMENTO_ABC',
      ],
    )
  })
})
