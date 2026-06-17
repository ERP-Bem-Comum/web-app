/**
 * Use-cases de Colaborador (application) — orquestração thin sobre a porta `CollaboratorClient`.
 * TDD com fake client (sem I/O real). Verifica que o use-case repassa o Result da porta.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { ok, isOk } from '#shared/primitives/result.ts'
import {
  createListCollaborators,
  createGetCollaborator,
  createCreateCollaborator,
  createCompleteCollaboratorRegistration,
  createUpdateCollaborator,
  createDeactivateCollaborator,
  createImportCollaborators,
  type CollaboratorClient,
} from '#modules/partners/server/application/collaborator/collaborator.use-cases.ts'
import type { CollaboratorDetail } from '#modules/partners/server/domain/collaborator/collaborator.io.ts'

const fakeDetail: CollaboratorDetail = {
  id: '1',
  name: 'Ana',
  email: 'ana@bemcomum.dev',
  occupationArea: 'EPV',
  role: 'Analista',
  registration: 'pre-registration',
  activation: 'active',
  cpf: '11144477735',
  startOfContract: '2024-01-01',
  employmentRelationship: 'PJ',
  territory: null,
}

const fakeClient: CollaboratorClient = {
  list: () => Promise.resolve(ok({ items: [], meta: { page: 1, limit: 5, total: 0 } })),
  getById: () => Promise.resolve(ok(fakeDetail)),
  create: () => Promise.resolve(ok(fakeDetail)),
  deactivate: () =>
    Promise.resolve(ok({ ...fakeDetail, activation: 'inactive', registration: 'pre-registration' })),
  reactivate: () => Promise.resolve(ok(fakeDetail)),
  completeRegistration: () => Promise.resolve(ok({ ...fakeDetail, registration: 'complete' })),
  update: () => Promise.resolve(ok({ ...fakeDetail, role: 'Coordenadora' })),
  importCsv: () => Promise.resolve(ok({ created: 2, failed: [{ line: 3, error: 'invalid-email' }] })),
}

describe('Collaborator use-cases', () => {
  it('list repassa o resultado da porta', async () => {
    const r = await createListCollaborators({ client: fakeClient })({ page: 1, limit: 5 }, 'token')
    assert.equal(isOk(r) && r.value.meta.total === 0, true)
  })
  it('get repassa o detail', async () => {
    const r = await createGetCollaborator({ client: fakeClient })('1', 'token')
    assert.equal(isOk(r) && r.value.id === '1', true)
  })
  it('create repassa o detail', async () => {
    const r = await createCreateCollaborator({ client: fakeClient })(
      {
        name: 'Ana',
        email: 'ana@bemcomum.dev',
        cpf: '11144477735',
        occupationArea: 'EPV',
        role: 'Analista',
        startOfContract: '2024-01-01',
        employmentRelationship: 'PJ',
        territory: null,
      },
      'token',
    )
    assert.equal(isOk(r) && r.value.name === 'Ana', true)
  })
  it('deactivate retorna inactive', async () => {
    const r = await createDeactivateCollaborator({ client: fakeClient })(
      '1',
      'TEMPO_CONTRATO_FINALIZADO',
      'token',
    )
    assert.equal(isOk(r) && r.value.activation === 'inactive', true)
  })
  it('import retorna relatório parcial (created + failed)', async () => {
    const r = await createImportCollaborators({ client: fakeClient })(
      { filename: 'c.csv', csv: 'name,email\nAna,a@b.dev' },
      'token',
    )
    assert.equal(isOk(r) && r.value.created === 2 && r.value.failed.length === 1, true)
  })
  it('completeRegistration promove a situação para complete', async () => {
    const r = await createCompleteCollaboratorRegistration({ client: fakeClient })(
      { id: '1', rg: '12.345.678-9', biography: 'Olá' },
      'token',
    )
    assert.equal(isOk(r) && r.value.registration === 'complete', true)
  })
  it('update retorna o detail atualizado', async () => {
    const r = await createUpdateCollaborator({ client: fakeClient })(
      {
        id: '1',
        name: 'Ana',
        email: 'ana@bemcomum.dev',
        cpf: '11144477735',
        occupationArea: 'EPV',
        role: 'Coordenadora',
        startOfContract: '2024-01-01',
        employmentRelationship: 'PJ',
      },
      'token',
    )
    assert.equal(isOk(r) && r.value.role === 'Coordenadora', true)
  })
})
