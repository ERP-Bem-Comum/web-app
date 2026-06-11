/**
 * Geography use-cases (node:test, puro com fakes) — a validação de VO (UF/IbgeCode) acontece ANTES de
 * tocar o core-api: input inválido nem chega ao client (defesa + exercita o VO branded, §IV).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import { isErr, ok } from '#shared/primitives/result.ts'
import {
  createTogglePartnerState,
  createTogglePartnerMunicipality,
  type GeographyClient,
} from '#modules/partners/server/application/geography/geography.use-cases.ts'
import type { PartnerState } from '#modules/partners/server/domain/geography/geography.types.ts'

const fail = (): never => {
  throw new Error('o client não deveria ser chamado para input inválido')
}
const neverClient: GeographyClient = {
  listPartnerStates: fail,
  setPartnerState: fail,
  listMunicipalitiesByUf: fail,
  setPartnerMunicipality: fail,
  listAddedMunicipalities: fail,
}

describe('geography use-cases — validação de VO antes do core-api', () => {
  it('togglePartnerState: UF inválida → invalid-state (não chama o client)', async () => {
    const r = await createTogglePartnerState({ client: neverClient })('XX', true, 'tok')
    assert.ok(isErr(r) && r.error === 'invalid-state')
  })

  it('togglePartnerMunicipality: ibgeCode inválido → invalid-ibge-code', async () => {
    const r = await createTogglePartnerMunicipality({ client: neverClient })('123', true, 'tok')
    assert.ok(isErr(r) && r.error === 'invalid-ibge-code')
  })

  it('togglePartnerState: UF válida → delega ao client', async () => {
    const state: PartnerState = { uf: 'SP', isPartner: true }
    const okClient: GeographyClient = { ...neverClient, setPartnerState: () => Promise.resolve(ok(state)) }
    const r = await createTogglePartnerState({ client: okClient })('SP', true, 'tok')
    assert.ok(!isErr(r) && r.value.uf === 'SP')
  })
})
