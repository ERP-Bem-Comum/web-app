import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createGeographyRepository } from '../../../../../../src/modules/partners/client/data/repository/geography.repository.ts'
import { isOk, isErr } from '../../../../../../src/shared/primitives/result.ts'
import type {
  PartnerMunicipality,
  PartnerState,
} from '../../../../../../src/modules/partners/client/data/model/geography.model.ts'

const states: readonly PartnerState[] = [{ uf: 'SP', isPartner: true }]
const muni: PartnerMunicipality = { ibgeCode: '3550308', uf: 'SP', name: 'São Paulo', isPartner: true }

const deps = {
  listPartnerStatesFn: () => Promise.resolve({ ok: true as const, data: states }),
  togglePartnerStateFn: () => Promise.resolve({ ok: true as const, data: { uf: 'SP', isPartner: false } }),
  listMunicipalitiesByUfFn: () => Promise.resolve({ ok: true as const, data: [muni] }),
  togglePartnerMunicipalityFn: () => Promise.resolve({ ok: true as const, data: { ...muni, isPartner: false } }),
  listAddedMunicipalitiesFn: () => Promise.resolve({ ok: true as const, data: [muni] }),
}

describe('GeographyRepository (mapeia FnResult → Result)', () => {
  it('listStates / listMunicipalities: ok', async () => {
    const repo = createGeographyRepository(deps)
    assert.equal(isOk(await repo.listStates()), true)
    const m = await repo.listMunicipalities('SP')
    assert.equal(isOk(m) && m.value[0]?.name === 'São Paulo', true)
  })

  it('listAddedMunicipalities: mapeia FnResult ok → Result', async () => {
    const repo = createGeographyRepository(deps)
    const r = await repo.listAddedMunicipalities()
    assert.equal(isOk(r) && r.value[0]?.name === 'São Paulo', true)
  })

  it('toggleState / toggleMunicipality: devolve o DTO confirmado', async () => {
    const repo = createGeographyRepository(deps)
    const s = await repo.toggleState({ uf: 'SP', isPartner: false })
    assert.equal(isOk(s) && !s.value.isPartner, true)
    const m = await repo.toggleMunicipality({ ibgeCode: '3550308', isPartner: false })
    assert.equal(isOk(m) && !m.value.isPartner, true)
  })

  it('propaga erro do BFF como err(PartnersError)', async () => {
    const repo = createGeographyRepository({
      ...deps,
      listPartnerStatesFn: () => Promise.resolve({ ok: false as const, error: 'forbidden' as const }),
    })
    const r = await repo.listStates()
    assert.equal(isErr(r) && r.error === 'forbidden', true)
  })
})
