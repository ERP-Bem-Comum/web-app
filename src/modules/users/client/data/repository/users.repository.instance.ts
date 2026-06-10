/**
 * Instância da UsersRepository — wire das server functions reais (import direto de server/adapters —
 * boundary §I/§III). Espelha `act.repository.instance.ts`.
 */
import { listUsersFn } from '#modules/users/server/adapters/server-fns/list-users.query.fn.ts'
import { createUserFn } from '#modules/users/server/adapters/server-fns/create-user.service.fn.ts'
import { getUserFn } from '#modules/users/server/adapters/server-fns/get-user.query.fn.ts'
import { updateUserFn } from '#modules/users/server/adapters/server-fns/update-user.service.fn.ts'
import { setUserStatusFn } from '#modules/users/server/adapters/server-fns/set-user-status.service.fn.ts'
import { getMeFn } from '#modules/users/server/adapters/server-fns/get-me.query.fn.ts'
import { updateMeFn } from '#modules/users/server/adapters/server-fns/update-me.service.fn.ts'
import { changePasswordFn } from '#modules/users/server/adapters/server-fns/change-password.service.fn.ts'

import { createUsersRepository } from './users.repository.ts'

export const usersRepository = createUsersRepository({
  listUsersFn: (opts) => listUsersFn(opts),
  createUserFn: (opts) => createUserFn(opts),
  getUserFn: (opts) => getUserFn(opts),
  updateUserFn: (opts) => updateUserFn(opts),
  setUserStatusFn: (opts) => setUserStatusFn(opts),
  getMeFn: () => getMeFn(),
  updateMeFn: (opts) => updateMeFn(opts),
  changePasswordFn: (opts) => changePasswordFn(opts),
})
