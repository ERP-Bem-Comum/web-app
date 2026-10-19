/**
 * Número do contrato informável na criação (spec 118) — node:test puro (imports `#`).
 *  - máscara e validação de formato (`NNN/AAAA` ou `NNNN/AAAA`);
 *  - schemas de borda (client e BFF) aceitam ausente e recusam formato inválido;
 *  - o adapter envia `sequentialNumber` só quando presente e mapeia os erros novos;
 *  - a tag i18n do 409 de número repetido.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  isContractNumberValid,
  maskContractNumber,
} from '#modules/contracts/client/contract-create/components/contract-form.controller.ts'
import { CreateContractInputSchema as ClientCreateSchema } from '#modules/contracts/client/data/model/contracts.model.ts'
import { CreateContractInputSchema as BffCreateSchema } from '#modules/contracts/server/adapters/contracts.schemas.ts'
import { SLUG_TO_ERROR } from '#modules/contracts/server/adapters/core-api/core-api-contracts.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'

describe('maskContractNumber', () => {
  it('só dígitos; a barra entra antes dos 4 últimos', () => {
    assert.equal(maskContractNumber('0123'), '0123')
    assert.equal(maskContractNumber('01232024'), '0123/2024')
    assert.equal(maskContractNumber('1232024'), '123/2024')
    assert.equal(maskContractNumber('0123/2024'), '0123/2024')
    assert.equal(maskContractNumber('CT 0123/2024'), '0123/2024')
  })

  it('no máximo NNNN/AAAA (8 dígitos)', () => {
    assert.equal(maskContractNumber('012320249'), '0123/2024')
  })
})

describe('isContractNumberValid', () => {
  it('vazio é válido (o core-api gera o número)', () => {
    assert.equal(isContractNumberValid(''), true)
    assert.equal(isContractNumberValid('  '), true)
  })

  it('aceita NNN/AAAA e NNNN/AAAA, de qualquer ano', () => {
    for (const v of ['0123/2024', '123/2024', '0001/2019']) assert.equal(isContractNumberValid(v), true, v)
  })

  it('recusa 12/2024, ABC, 12345/2026 e 0123/24', () => {
    for (const v of ['12/2024', 'ABC', '12345/2026', '0123/24'])
      assert.equal(isContractNumberValid(v), false, v)
  })
})

const baseInput = {
  title: 'Contrato X',
  objective: 'Objeto',
  originalValueCents: 1000,
  originalPeriod: { start: new Date('2026-01-01'), end: new Date('2026-12-31') },
  classification: 'Contract',
  contractModel: 'Service',
  contractType: 'Supplier',
} as const

describe('CreateContractInputSchema — sequentialNumber (client e BFF)', () => {
  for (const [name, schema] of [
    ['client', ClientCreateSchema],
    ['BFF', BffCreateSchema],
  ] as const) {
    it(`${name}: ausente passa; NNN/AAAA e NNNN/AAAA passam; formato inválido é recusado`, () => {
      assert.equal(schema.safeParse(baseInput).success, true)
      assert.equal(schema.safeParse({ ...baseInput, sequentialNumber: '0123/2024' }).success, true)
      assert.equal(schema.safeParse({ ...baseInput, sequentialNumber: '123/2024' }).success, true)
      assert.equal(schema.safeParse({ ...baseInput, sequentialNumber: '12/2024' }).success, false)
      assert.equal(schema.safeParse({ ...baseInput, sequentialNumber: 'CT 0123/2024' }).success, false)
    })
  }
})

describe('SLUG_TO_ERROR — erros do número informado', () => {
  it('número repetido (409) → contract-number-duplicated', () => {
    assert.equal(SLUG_TO_ERROR['contract-sequential-number-duplicated'], 'contract-number-duplicated')
  })

  it('formato inválido (422) → invalid-code', () => {
    assert.equal(SLUG_TO_ERROR.ContractSequentialNumberInvalidFormat, 'invalid-code')
  })

  it('a tag i18n do número repetido é própria (não cai no "Algo deu errado")', () => {
    assert.equal(contractsErrorTag('contract-number-duplicated'), 'contracts.error.number-duplicated')
  })
})
