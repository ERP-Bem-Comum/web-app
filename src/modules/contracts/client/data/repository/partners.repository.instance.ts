/**
 * Instância da repository de parceiros — wire da query.fn real (fan-out no BFF, ADR-0010).
 */
import { searchPartnersFn } from '#modules/contracts/server/adapters/server-fns/search-partners.query.fn.ts'
import { createPartnersRepository } from './partners.repository.ts'

export const partnersRepository = createPartnersRepository({
  searchPartnersFn: (opts) => searchPartnersFn(opts),
})
