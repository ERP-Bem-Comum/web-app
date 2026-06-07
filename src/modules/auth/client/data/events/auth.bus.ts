/**
 * Bus de auth (singleton client) — instância do Event Bus genérico (`shared/bus`) tipada com `AuthEvent`.
 * `client/usecase` emite; `view-model` (use-current-user) assina p/ reagir (ex.: invalidar a query `me`).
 */
import { createEventBus } from '#shared/bus/bus.ts'
import type { AuthEvent } from './auth.events.ts'

export const authBus = createEventBus<AuthEvent>()
