import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  applyMunicipalityToggle,
  applyStateToggle,
  countPartners,
  sortMunicipalities,
  sortStates,
} from '../../../../../src/modules/partners/client/geography/geography.view-model.ts'
import type {
  PartnerMunicipality,
  PartnerState,
} from '../../../../../src/modules/partners/client/data/model/geography.model.ts'

const states: readonly PartnerState[] = [
  { uf: 'SP', isPartner: true },
  { uf: 'BA', isPartner: false },
  { uf: 'AC', isPartner: true },
]

const munis: readonly PartnerMunicipality[] = [
  { ibgeCode: '3550308', uf: 'SP', name: 'São Paulo', isPartner: true },
  { ibgeCode: '3509502', uf: 'SP', name: 'Campinas', isPartner: false },
]

describe('geography.view-model', () => {
  it('sortStates ordena por uf sem mutar a entrada', () => {
    const sorted = sortStates(states)
    assert.deepEqual(sorted.map((s) => s.uf), ['AC', 'BA', 'SP'])
    assert.equal(states[0]?.uf, 'SP') // original intacto
  })

  it('sortMunicipalities ordena por nome', () => {
    assert.deepEqual(sortMunicipalities(munis).map((m) => m.name), ['Campinas', 'São Paulo'])
  })

  it('applyStateToggle troca o isPartner só do alvo (imutável)', () => {
    const next = applyStateToggle(states, 'BA', true)
    assert.equal(next.find((s) => s.uf === 'BA')?.isPartner, true)
    assert.equal(next.find((s) => s.uf === 'SP')?.isPartner, true)
    assert.equal(states.find((s) => s.uf === 'BA')?.isPartner, false) // original intacto
  })

  it('applyMunicipalityToggle troca o isPartner só do alvo (por ibgeCode)', () => {
    const next = applyMunicipalityToggle(munis, '3509502', true)
    assert.equal(next.find((m) => m.ibgeCode === '3509502')?.isPartner, true)
    assert.equal(next.find((m) => m.ibgeCode === '3550308')?.isPartner, true)
  })

  it('countPartners conta os marcados', () => {
    assert.equal(countPartners(states), 2)
    assert.equal(countPartners(munis), 1)
  })
})
