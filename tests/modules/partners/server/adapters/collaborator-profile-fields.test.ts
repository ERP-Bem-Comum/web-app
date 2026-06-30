/**
 * Perfil completo do Colaborador (US2) — o RESPONSE schema do core-api carrega os campos novos
 * (sex, maritalStatus, children, pwd, leave, publicSectorExperienceDuration) e tolera ausência/legado
 * (nullish). Sem o parse, o strip() descartaria os campos e o mapper não os veria.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { CoreApiCollaboratorDetailSchema } from '#modules/partners/server/adapters/core-api/collaborator.schema.ts'

const baseDetail = {
  id: 'c-1',
  name: 'Fulana',
  email: 'f@x.org',
  occupationArea: 'PARC',
  role: 'Dev',
  status: 'Complete' as const,
  active: true,
  contractCount: 0,
  cpf: '12345678901',
  startOfContract: '2024-01-01',
  employmentRelationship: 'CLT' as const,
}

describe('CoreApiCollaboratorDetailSchema — perfil completo (US2)', () => {
  it('preserva os campos novos quando presentes', () => {
    const r = CoreApiCollaboratorDetailSchema.safeParse({
      ...baseDetail,
      sex: 'F',
      maritalStatus: 'single',
      hasChildren: true,
      childrenCount: 2,
      childrenAges: [5, 12],
      isPwd: false,
      pwdDescription: null,
      isOnLeave: true,
      leaveDuration: '6 meses',
      leaveRenewable: false,
      leaveRenewalDuration: null,
      publicSectorExperienceDuration: '3 anos',
    })
    assert.equal(r.success, true)
    if (r.success) {
      assert.equal(r.data.sex, 'F')
      assert.equal(r.data.maritalStatus, 'single')
      assert.equal(r.data.hasChildren, true)
      assert.equal(r.data.childrenCount, 2)
      assert.deepEqual(r.data.childrenAges, [5, 12])
      assert.equal(r.data.isPwd, false)
      assert.equal(r.data.isOnLeave, true)
      assert.equal(r.data.leaveDuration, '6 meses')
      assert.equal(r.data.publicSectorExperienceDuration, '3 anos')
    }
  })

  it('tolera ausência total dos campos (pré-cadastro/legado)', () => {
    const r = CoreApiCollaboratorDetailSchema.safeParse(baseDetail)
    assert.equal(r.success, true)
    if (r.success) {
      assert.equal(r.data.sex ?? null, null)
      assert.equal(r.data.childrenAges ?? null, null)
      assert.equal(r.data.isOnLeave ?? null, null)
    }
  })
})
