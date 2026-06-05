/**
 * Instância da repository de parceiros — wire server function mock.
 */
import { listPartnersMockFn } from '#modules/contracts/server/adapters/server-fns/list-partners-mock.server-fn.ts'
import { createPartnersRepository } from './partners.repository.ts'

export const partnersRepository = createPartnersRepository({
  listPartnersMockFn: (opts) => listPartnersMockFn(opts),
})
