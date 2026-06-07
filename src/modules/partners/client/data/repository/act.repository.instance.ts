/**
 * Instância da ActRepository — wire das server functions reais (import direto de server/adapters —
 * boundary §I/§III). Espelha `financier.repository.instance.ts`.
 */
import { listActsFn } from '#modules/partners/server/adapters/server-fns/act/list-acts.query.fn.ts'
import { getActFn } from '#modules/partners/server/adapters/server-fns/act/get-act.query.fn.ts'
import { createActFn } from '#modules/partners/server/adapters/server-fns/act/create-act.service.fn.ts'
import { updateActFn } from '#modules/partners/server/adapters/server-fns/act/update-act.service.fn.ts'
import { deactivateActFn } from '#modules/partners/server/adapters/server-fns/act/deactivate-act.service.fn.ts'
import { reactivateActFn } from '#modules/partners/server/adapters/server-fns/act/reactivate-act.service.fn.ts'

import { createActRepository } from './act.repository.ts'

export const actRepository = createActRepository({
  listActsFn: (opts) => listActsFn(opts),
  getActFn: (opts) => getActFn(opts),
  createActFn: (opts) => createActFn(opts),
  updateActFn: (opts) => updateActFn(opts),
  deactivateActFn: (opts) => deactivateActFn(opts),
  reactivateActFn: (opts) => reactivateActFn(opts),
})
