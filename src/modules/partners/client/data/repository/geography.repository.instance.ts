/**
 * Instância da GeographyRepository — wire das server functions reais (import direto de server/adapters —
 * boundary §I/§III).
 */
import { listPartnerStatesFn } from '#modules/partners/server/adapters/server-fns/geography/list-partner-states.query.fn.ts'
import { togglePartnerStateFn } from '#modules/partners/server/adapters/server-fns/geography/toggle-partner-state.service.fn.ts'
import { listMunicipalitiesByUfFn } from '#modules/partners/server/adapters/server-fns/geography/list-municipalities-by-uf.query.fn.ts'
import { togglePartnerMunicipalityFn } from '#modules/partners/server/adapters/server-fns/geography/toggle-partner-municipality.service.fn.ts'
import { listAddedMunicipalitiesFn } from '#modules/partners/server/adapters/server-fns/geography/list-added-municipalities.query.fn.ts'

import { createGeographyRepository } from './geography.repository.ts'

export const geographyRepository = createGeographyRepository({
  listPartnerStatesFn: () => listPartnerStatesFn(),
  togglePartnerStateFn: (opts) => togglePartnerStateFn(opts),
  listMunicipalitiesByUfFn: (opts) => listMunicipalitiesByUfFn(opts),
  togglePartnerMunicipalityFn: (opts) => togglePartnerMunicipalityFn(opts),
  listAddedMunicipalitiesFn: () => listAddedMunicipalitiesFn(),
})
