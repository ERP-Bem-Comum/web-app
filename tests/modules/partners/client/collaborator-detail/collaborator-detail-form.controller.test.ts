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
