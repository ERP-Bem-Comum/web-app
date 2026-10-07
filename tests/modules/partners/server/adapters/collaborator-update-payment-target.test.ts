/**
 * Spec 120 — o PUT do colaborador leva banco/PIX (core-api#1029). Antes, a borda do BFF fazia `omit`
 * e o dado digitado sumia sem aviso. Cobre a borda Zod (não descarta mais) e o corpo que o adapter
 * manda ao core-api (objeto substitui; `null` mantém o gravado).
 */
import { describe, it, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'

import { UpdateCollaboratorInputSchema } from '#modules/partners/server/adapters/collaborator.io-schemas.ts'
import { createCoreApiCollaboratorsClient } from '#modules/partners/server/adapters/core-api/core-api-collaborators.ts'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const base = {
  id: 'c-1',
  name: 'Ana',
  email: 'ana@bemcomum.dev',
  cpf: '11144477735',
  occupationArea: 'EPV',
  role: 'Coordenadora',
  startOfContract: '2024-01-01',
  employmentRelationship: 'PJ',
} as const

const bankAccount = { bank: '237', agency: '1234', accountNumber: '56789', checkDigit: '0' }
const pixKey = { keyType: 'cpf', key: '11144477735' } as const

describe('UpdateCollaboratorInputSchema — banco/PIX (spec 120)', () => {
  it('mantém bankAccount e pixKey no input (não faz mais strip)', () => {
    const r = UpdateCollaboratorInputSchema.safeParse({ ...base, bankAccount, pixKey })
    assert.equal(r.success, true)
    if (r.success) {
      assert.deepEqual(r.data.bankAccount, bankAccount)
      assert.deepEqual(r.data.pixKey, pixKey)
    }
  })

  it('aceita null nos dois (o core-api mantém o gravado)', () => {
    const r = UpdateCollaboratorInputSchema.safeParse({ ...base, bankAccount: null, pixKey: null })
    assert.equal(r.success, true)
  })

  it('recusa banco parcial (conta vazia)', () => {
    const r = UpdateCollaboratorInputSchema.safeParse({
      ...base,
      bankAccount: { ...bankAccount, accountNumber: '' },
      pixKey: null,
    })
    assert.equal(r.success, false)
  })

  it('continua descartando território (o PUT não altera)', () => {
    const r = UpdateCollaboratorInputSchema.safeParse({
      ...base,
      bankAccount: null,
      pixKey: null,
      territory: { uf: 'SP', municipality: 'São Paulo' },
    })
    assert.equal(r.success && !('territory' in r.data), true)
  })
})

describe('core-api client — corpo do PUT /collaborators/:id', () => {
  it('envia bankAccount e pixKey ao core-api, sem o id no corpo', async () => {
    let putBody: unknown = undefined
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        putBody = JSON.parse(typeof init.body === 'string' ? init.body : 'null')
        return Promise.resolve(new Response(null, { status: 204 }))
      }
      return Promise.resolve(
        new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
      )
    }
    await createCoreApiCollaboratorsClient('http://core/api/v1').update(
      { ...base, occupationArea: 'EPV', employmentRelationship: 'PJ', bankAccount, pixKey },
      'token',
    )
    const body = putBody as Record<string, unknown>
    assert.deepEqual(body.bankAccount, bankAccount)
    assert.deepEqual(body.pixKey, pixKey)
    assert.equal('id' in body, false)
  })
})
