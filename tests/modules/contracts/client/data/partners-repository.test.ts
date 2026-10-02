/**
 * PartnersRepository (contract-create) — PF × PJ pelo DOCUMENTO (#1022). O agregador `/partners` não
 * devolve `personType`; um Fornecedor pode ser PF (CPF). node:test puro (imports `#`).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createPartnersRepository } from '#modules/contracts/client/data/repository/partners.repository.ts'

type Kind = 'Fornecedor' | 'Financiador' | 'Colaborador' | 'ACT'

const repoWith = (items: readonly { id: string; document?: string; kind: Kind }[]) =>
  createPartnersRepository({
    searchPartnersFn: () =>
      Promise.resolve({ ok: true as const, data: items.map((p) => ({ ...p, name: `P ${p.id}` })) }),
  })

describe('partners.repository — documento do contratado', () => {
  it('fornecedor PF (CPF) sai como cpf, não como cnpj', async () => {
    const r = await repoWith([{ id: '1', document: '52998224725', kind: 'Fornecedor' }]).search('')
    assert.ok(r.ok)
    assert.equal(r.value[0]?.cpf, '52998224725')
    assert.equal(r.value[0]?.cnpj, undefined)
  })

  it('fornecedor PJ (CNPJ, inclusive alfanumérico) sai como cnpj', async () => {
    const r = await repoWith([
      { id: '1', document: '11222333000181', kind: 'Fornecedor' },
      { id: '2', document: '12ABC34501DE35', kind: 'Fornecedor' },
    ]).search('')
    assert.ok(r.ok)
    assert.deepEqual(
      r.value.map((p) => [p.cnpj, p.cpf]),
      [
        ['11222333000181', undefined],
        ['12ABC34501DE35', undefined],
      ],
    )
  })

  it('colaborador continua PF (o CPF decide, não o tipo)', async () => {
    const r = await repoWith([{ id: '1', document: '14396412002', kind: 'Colaborador' }]).search('')
    assert.ok(r.ok)
    assert.equal(r.value[0]?.cpf, '14396412002')
  })
})
