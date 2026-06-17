import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { CollaboratorFormSchema } from '../../../../../src/modules/partners/client/data/model/collaborator.model.ts'

const validForm = {
  name: 'Ana Souza',
  email: 'ana@bemcomum.dev',
  cpf: '111.444.777-35',
  occupationArea: 'EPV',
  role: 'Analista',
  startOfContract: '2026-01-15',
  employmentRelationship: 'PJ',
}

describe('CollaboratorFormSchema — território (#42)', () => {
  it('território ausente → null (default)', () => {
    const r = CollaboratorFormSchema.parse(validForm)
    assert.equal(r.territory, null)
    assert.equal(r.cpf, '11144477735') // normaliza CPF p/ 11 dígitos (não-regressão)
  })

  it('aceita território completo (UF + município)', () => {
    const r = CollaboratorFormSchema.parse({
      ...validForm,
      territory: { uf: 'SP', municipality: 'São Paulo' },
    })
    assert.equal(r.territory?.uf, 'SP')
    assert.equal(r.territory?.municipality, 'São Paulo')
  })

  it('aceita território parcial (só UF ou só município, com null no outro)', () => {
    const soUf = CollaboratorFormSchema.parse({ ...validForm, territory: { uf: 'CE', municipality: null } })
    assert.equal(soUf.territory?.uf, 'CE')
    assert.equal(soUf.territory?.municipality, null)
    const soMun = CollaboratorFormSchema.parse({
      ...validForm,
      territory: { uf: null, municipality: 'Fortaleza' },
    })
    assert.equal(soMun.territory?.municipality, 'Fortaleza')
  })
})
