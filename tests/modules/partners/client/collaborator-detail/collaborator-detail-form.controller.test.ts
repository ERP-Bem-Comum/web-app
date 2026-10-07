/**
 * Perfil completo do Colaborador (US2) — lógica PURA do controller de detalhe (node:test):
 * helpers de "idade dos filhos" (texto ↔ int[]), buildCompleteInput (sim/não→bool, idades, enums)
 * e a hidratação stateFromDetail. Sem React/DOM (as funções são puras e exportadas).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  parseChildrenAges,
  formatChildrenAges,
  buildCompleteInput,
  computeHasCompleteData,
  stateFromDetail,
  buildPaymentTarget,
  validatePaymentTarget,
  type CollaboratorDetailFormState,
} from '#modules/partners/client/collaborator-detail/components/collaborator-detail-form.controller.ts'
import type { CollaboratorDetail } from '#modules/partners/client/data/model/collaborator.model.ts'

// Estado vazio (todos os campos em branco) — base para variações nos casos.
const emptyState: CollaboratorDetailFormState = {
  name: '',
  email: '',
  cpf: '',
  occupationArea: '',
  role: '',
  startOfContract: '',
  employmentRelationship: '',
  rg: '',
  dateOfBirth: '',
  completeAddress: '',
  telephone: '',
  emergencyContactName: '',
  emergencyContactTelephone: '',
  genderIdentity: '',
  race: '',
  allergies: '',
  foodCategory: '',
  foodCategoryDescription: '',
  education: '',
  biography: '',
  experienceInThePublicSector: '',
  sex: '',
  maritalStatus: '',
  publicSectorExperienceDuration: '',
  hasChildren: '',
  childrenCount: '',
  childrenAges: '',
  isPwd: '',
  pwdDescription: '',
  isOnLeave: '',
  leaveDuration: '',
  leaveRenewable: '',
  leaveRenewalDuration: '',
  uf: '',
  municipality: '',
  bank: '',
  agency: '',
  accountNumber: '',
  checkDigit: '',
  pixKeyType: 'cpf',
  pixKey: '',
}

describe('parseChildrenAges — texto livre → int[]', () => {
  it('extrai os números na ordem de "5 anos, 12 anos"', () => {
    assert.deepEqual(parseChildrenAges('5 anos, 12 anos'), [5, 12])
  })
  it('aceita formatos variados (só os dígitos importam)', () => {
    assert.deepEqual(parseChildrenAges('3; 7;10'), [3, 7, 10])
  })
  it('texto sem números → []', () => {
    assert.deepEqual(parseChildrenAges('sem idades'), [])
  })
  it('vazio → []', () => {
    assert.deepEqual(parseChildrenAges(''), [])
  })
  it('inclui zero (recém-nascido)', () => {
    assert.deepEqual(parseChildrenAges('0, 2'), [0, 2])
  })
})

describe('formatChildrenAges — int[] → texto', () => {
  it('[5, 12] → "5, 12"', () => {
    assert.equal(formatChildrenAges([5, 12]), '5, 12')
  })
  it('undefined → ""', () => {
    assert.equal(formatChildrenAges(undefined), '')
  })
  it('[] → ""', () => {
    assert.equal(formatChildrenAges([]), '')
  })
})

describe('buildCompleteInput — envio do PATCH complete-registration', () => {
  it('estado vazio → só o id (todos os opcionais undefined)', () => {
    const out = buildCompleteInput(emptyState, 'c-1')
    assert.equal(out.id, 'c-1')
    assert.equal(out.sex, undefined)
    assert.equal(out.maritalStatus, undefined)
    assert.equal(out.hasChildren, undefined)
    assert.equal(out.childrenCount, undefined)
    assert.equal(out.childrenAges, undefined)
    assert.equal(out.isPwd, undefined)
    assert.equal(out.isOnLeave, undefined)
    assert.equal(out.leaveRenewable, undefined)
    assert.equal(out.experienceInThePublicSector, undefined)
  })

  it('sim/não → boolean (hasChildren=sim, isPwd=nao)', () => {
    const out = buildCompleteInput({ ...emptyState, hasChildren: 'sim', isPwd: 'nao' }, 'c-1')
    assert.equal(out.hasChildren, true)
    assert.equal(out.isPwd, false)
  })

  it('childrenAges texto → int[]; childrenCount texto → int', () => {
    const out = buildCompleteInput(
      { ...emptyState, childrenAges: '5 anos, 12 anos', childrenCount: '2' },
      'c-1',
    )
    assert.deepEqual(out.childrenAges, [5, 12])
    assert.equal(out.childrenCount, 2)
  })

  it('childrenCount inválido → undefined', () => {
    const out = buildCompleteInput({ ...emptyState, childrenCount: 'abc' }, 'c-1')
    assert.equal(out.childrenCount, undefined)
  })

  it('enums sex/maritalStatus passam o valor do domínio (trim)', () => {
    const out = buildCompleteInput({ ...emptyState, sex: 'F', maritalStatus: 'married' }, 'c-1')
    assert.equal(out.sex, 'F')
    assert.equal(out.maritalStatus, 'married')
  })

  it('strings de afastamento via blank (trim; vazio → undefined)', () => {
    const out = buildCompleteInput(
      {
        ...emptyState,
        isOnLeave: 'sim',
        leaveDuration: ' 6 meses ',
        leaveRenewable: 'sim',
        leaveRenewalDuration: '',
      },
      'c-1',
    )
    assert.equal(out.isOnLeave, true)
    assert.equal(out.leaveDuration, '6 meses')
    assert.equal(out.leaveRenewable, true)
    assert.equal(out.leaveRenewalDuration, undefined)
  })

  it('publicSectorExperienceDuration via blank', () => {
    const out = buildCompleteInput({ ...emptyState, publicSectorExperienceDuration: '3 anos' }, 'c-1')
    assert.equal(out.publicSectorExperienceDuration, '3 anos')
  })
})

describe('computeHasCompleteData — detecta dado de perfil preenchido', () => {
  it('estado vazio → false', () => {
    assert.equal(computeHasCompleteData(emptyState), false)
  })
  it('só um tri-state preenchido (hasChildren) → true', () => {
    assert.equal(computeHasCompleteData({ ...emptyState, hasChildren: 'nao' }), true)
  })
  it('só um texto novo (sex) → true', () => {
    assert.equal(computeHasCompleteData({ ...emptyState, sex: 'M' }), true)
  })
  it('só childrenAges → true', () => {
    assert.equal(computeHasCompleteData({ ...emptyState, childrenAges: '5' }), true)
  })
})

describe('stateFromDetail — hidratação a partir do detalhe', () => {
  const baseDetail: CollaboratorDetail = {
    id: 'c-1',
    name: 'Fulana',
    email: 'f@x.org',
    occupationArea: 'PARC',
    role: 'Dev',
    registration: 'complete',
    activation: 'active',
    contractCount: 0,
    cpf: '12345678901',
    startOfContract: '2024-01-01T00:00:00.000Z',
    employmentRelationship: 'CLT',
    territory: null,
    bankAccount: null,
    pixKey: null,
  }

  it('hidrata os campos de perfil (US2), incl. int[]→texto e bool→tri', () => {
    const s = stateFromDetail({
      ...baseDetail,
      sex: 'F',
      maritalStatus: 'single',
      hasChildren: true,
      childrenCount: 2,
      childrenAges: [5, 12],
      isPwd: false,
      isOnLeave: true,
      leaveRenewable: false,
      publicSectorExperienceDuration: '3 anos',
    })
    assert.equal(s.sex, 'F')
    assert.equal(s.maritalStatus, 'single')
    assert.equal(s.hasChildren, 'sim')
    assert.equal(s.childrenCount, '2')
    assert.equal(s.childrenAges, '5, 12')
    assert.equal(s.isPwd, 'nao')
    assert.equal(s.isOnLeave, 'sim')
    assert.equal(s.leaveRenewable, 'nao')
    assert.equal(s.publicSectorExperienceDuration, '3 anos')
  })

  it('campos ausentes → vazio/tri-state vazio (pré-cadastro)', () => {
    const s = stateFromDetail(baseDetail)
    assert.equal(s.sex, '')
    assert.equal(s.hasChildren, '')
    assert.equal(s.childrenAges, '')
    assert.equal(s.leaveRenewable, '')
  })

  it('round-trip: detalhe → estado → input preserva os valores', () => {
    const s = stateFromDetail({
      ...baseDetail,
      sex: 'M',
      hasChildren: true,
      childrenAges: [3, 7],
      childrenCount: 2,
    })
    const out = buildCompleteInput(s, baseDetail.id)
    assert.equal(out.sex, 'M')
    assert.equal(out.hasChildren, true)
    assert.deepEqual(out.childrenAges, [3, 7])
    assert.equal(out.childrenCount, 2)
  })
})

// ── Spec 120 — dados bancários e PIX editáveis no detalhe ─────────────────────────────────────────

const detailBase: CollaboratorDetail = {
  id: 'c-1',
  name: 'Ana',
  email: 'ana@x.org',
  occupationArea: 'PARC',
  role: 'Dev',
  registration: 'pre-registration',
  activation: 'active',
  contractCount: 0,
  cpf: '52998224725',
  startOfContract: '2024-01-01T00:00:00.000Z',
  employmentRelationship: 'CLT',
  territory: null,
  bankAccount: null,
  pixKey: null,
}
const withBank: CollaboratorDetail = {
  ...detailBase,
  bankAccount: { bank: '237', agency: '1234', accountNumber: '5678', checkDigit: '9' },
  pixKey: { keyType: 'email', key: 'ana@x.org' },
}
const filledBank = { bank: '001', agency: '4321', accountNumber: '98765', checkDigit: '1' }

describe('stateFromDetail — banco legado (spec 120)', () => {
  it('texto "237 - Bradesco" abre como o código 237', () => {
    const s = stateFromDetail({
      ...withBank,
      bankAccount: { bank: '237 - Bradesco', agency: '1234', accountNumber: '5678', checkDigit: '9' },
    })
    assert.equal(s.bank, '237')
  })
  it('nome sem código fica como está (o seletor mostra "não reconhecido")', () => {
    const s = stateFromDetail({
      ...withBank,
      bankAccount: { bank: 'Bradesco', agency: '1234', accountNumber: '5678', checkDigit: '9' },
    })
    assert.equal(s.bank, 'Bradesco')
  })
})

describe('buildPaymentTarget — corpo do PUT (spec 120)', () => {
  it('grupo vazio → null nos dois (o core-api mantém o gravado)', () => {
    assert.deepEqual(buildPaymentTarget(emptyState), { bankAccount: null, pixKey: null })
  })
  it('grupo preenchido → objetos, com trim', () => {
    const r = buildPaymentTarget({
      ...emptyState,
      ...filledBank,
      accountNumber: ' 98765 ',
      pixKeyType: 'cpf',
      pixKey: '52998224725',
    })
    assert.deepEqual(r.bankAccount, { ...filledBank, accountNumber: '98765' })
    assert.deepEqual(r.pixKey, { keyType: 'cpf', key: '52998224725' })
  })
  it('tipo de chave escolhido sem chave → pixKey null', () => {
    assert.equal(buildPaymentTarget({ ...emptyState, pixKeyType: 'email' }).pixKey, null)
  })
})

describe('validatePaymentTarget — antes do salvar (spec 120)', () => {
  it('sem dado bancário e sem nada gravado → ok', () => {
    assert.deepEqual(validatePaymentTarget(emptyState, detailBase), {})
  })
  it('grupo completo → ok', () => {
    assert.deepEqual(
      validatePaymentTarget(
        { ...emptyState, ...filledBank, pixKey: 'ana@x.org', pixKeyType: 'email' },
        detailBase,
      ),
      {},
    )
  })
  it('banco parcial (só o banco) → marca agência e conta', () => {
    const e = validatePaymentTarget({ ...emptyState, bank: '001' }, detailBase)
    assert.equal(e['bankAccount.agency'], true)
    assert.equal(e['bankAccount.accountNumber'], true)
    assert.equal(e['bankAccount.bank'], undefined)
  })
  it('agência com 3 dígitos → inválida (core-api exige 4 + DV opcional)', () => {
    const e = validatePaymentTarget({ ...emptyState, ...filledBank, agency: '123' }, detailBase)
    assert.equal(e['bankAccount.agency'], true)
  })
  it('agência legada com hífen "1234-5" → ok', () => {
    const e = validatePaymentTarget({ ...emptyState, ...filledBank, agency: '1234-5' }, detailBase)
    assert.deepEqual(e, {})
  })
  it('esvaziar banco/PIX já gravados → bloqueia (null manteria o gravado e a tela mentiria)', () => {
    const e = validatePaymentTarget(emptyState, withBank)
    assert.equal(e['bankAccount.removal'], true)
    assert.equal(e['pixKey.removal'], true)
  })
  it('trocar o banco já gravado → ok', () => {
    const s = { ...stateFromDetail(withBank), bank: '001', accountNumber: '11111' }
    assert.deepEqual(validatePaymentTarget(s, withBank), {})
  })
})
