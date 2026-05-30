/**
 * Composição do use-case de login (client) — wira a repository (porta) + o bus de auth.
 * O ViewModel consome `loginUseCase` daqui (client-view-model → client-usecase, boundary OK).
 */
import { authRepository } from '../data/auth.repository.instance.ts'
import { authBus } from '../data/auth.bus.ts'
import type { AuthEvent } from '../data/auth.events.ts'
import { createLoginUseCase } from './login.use-case.ts'

export const loginUseCase = createLoginUseCase({
  repo: authRepository,
  emit: (event: AuthEvent) => {
    authBus.emit(event)
  },
})
