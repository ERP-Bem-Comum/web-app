import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  ProgramFormSchema,
  formToCreateInput,
} from '../../../../../src/modules/programs/client/data/model/program.model.ts'

describe('ProgramFormSchema', () => {
  it('aceita form válido', () => {
    const r = ProgramFormSchema.safeParse({ name: 'ECC', sigla: 'ECC', director: 'Cristo', generalCharacteristics: 'Melhor encontro' })
    assert.equal(r.success, true)
  })

  it('rejeita nome vazio', () => {
    assert.equal(ProgramFormSchema.safeParse({ name: '', sigla: 'X', director: '', generalCharacteristics: '' }).success, false)
  })

  it('rejeita sigla vazia', () => {
    assert.equal(ProgramFormSchema.safeParse({ name: 'X', sigla: '', director: '', generalCharacteristics: '' }).success, false)
  })
})

describe('formToCreateInput', () => {
  it('converte strings vazias de director/características em null (como o backend espera)', () => {
    const out = formToCreateInput({ name: 'ECC', sigla: 'ECC', director: '', generalCharacteristics: '' })
    assert.deepEqual(out, { name: 'ECC', sigla: 'ECC', director: null, generalCharacteristics: null })
  })

  it('mantém os valores quando preenchidos', () => {
    const out = formToCreateInput({ name: 'EPV', sigla: 'EPV', director: 'Ana', generalCharacteristics: 'desc' })
    assert.deepEqual(out, { name: 'EPV', sigla: 'EPV', director: 'Ana', generalCharacteristics: 'desc' })
  })
})
