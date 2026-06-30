import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { partnerDetailToContractFields } from '../../../../../src/modules/contracts/client/contract-create/partner-detail-to-contract.ts'

describe('partnerDetailToContractFields (detalhe do parceiro → campos do contrato)', () => {
  it('Fornecedor/ACT: banco (checkDigit→dv) + pix + email', () => {
    const out = partnerDetailToContractFields({
      email: 'forn@x.com',
      bankAccount: { bank: '001', agency: '1234', accountNumber: '56789', checkDigit: '0' },
      pixKey: { keyType: 'cnpj', key: '12345678000190' },
    })
    assert.deepEqual(out, {
      email: 'forn@x.com',
      bancaryInfo: { bank: '001', agency: '1234', accountNumber: '56789', dv: '0' },
      pixInfo: { keyType: 'cnpj', key: '12345678000190' },
    })
  })

  it('Financiador: só telephone', () => {
    const out = partnerDetailToContractFields({ telephone: '11988887777' })
    assert.deepEqual(out, { telephone: '11988887777' })
  })

  it('Colaborador: só email', () => {
    const out = partnerDetailToContractFields({ email: 'colab@x.com' })
    assert.deepEqual(out, { email: 'colab@x.com' })
  })

  it('campos ausentes/null/vazios não são incluídos', () => {
    assert.deepEqual(partnerDetailToContractFields({ email: '', bankAccount: null, pixKey: null }), {})
    assert.deepEqual(partnerDetailToContractFields({}), {})
  })
})
