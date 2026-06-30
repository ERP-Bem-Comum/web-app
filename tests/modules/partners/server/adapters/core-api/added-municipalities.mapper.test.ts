import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { toAddedMunicipalities } from '../../../../../../src/modules/partners/server/adapters/core-api/added-municipalities.mapper.ts'

// DTOs cross-state do GET /partner-municipalities/added (sem isPartner — todos são parceiros).
const al1 = { ibgeCode: '2700300', uf: 'AL', name: 'Arapiraca' }
const al2 = { ibgeCode: '2704302', uf: 'AL', name: 'Maceió' }
const ce1 = { ibgeCode: '2312908', uf: 'CE', name: 'Sobral' }

describe('toAddedMunicipalities (mapeia/ordena municípios cross-state)', () => {
  it('mapeia cada item para PartnerMunicipality com isPartner: true', () => {
    const out = toAddedMunicipalities([al1])
    assert.equal(out.length, 1)
    assert.deepEqual(out[0], { ibgeCode: '2700300', uf: 'AL', name: 'Arapiraca', isPartner: true })
  })

  it('ordena por UF e depois por nome (estável)', () => {
    const out = toAddedMunicipalities([ce1, al2, al1])
    assert.deepEqual(
      out.map((m) => `${m.uf}/${m.name}`),
      ['AL/Arapiraca', 'AL/Maceió', 'CE/Sobral'],
    )
  })

  it('une itens de múltiplas páginas (acumulação) e ordena o conjunto', () => {
    // Simula a concatenação de 2 páginas (page1 = [ce1], page2 = [al1]) antes do map.
    const page1 = [ce1]
    const page2 = [al1]
    const out = toAddedMunicipalities([...page1, ...page2])
    assert.deepEqual(
      out.map((m) => m.uf),
      ['AL', 'CE'],
    )
    assert.equal(out.every((m) => m.isPartner), true)
  })

  it('lista vazia → array vazio', () => {
    assert.deepEqual(toAddedMunicipalities([]), [])
  })
})
