/**
 * Server function: trilha de auditoria do documento (GET /api/v2/financial/documents/:id/timeline). Fronteira
 * RPC (§III) + COMPOSIÇÃO do BFF: busca os eventos crus (actor = UUID) e **resolve o nome do autor** cruzando
 * com o módulo Users (cross-módulo só via public-api — §I). Degrada gracioso: autor não-resolvido / sistema →
 * `actorName: null`. RBAC `fiscal-document:read` (checado no handler).
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { getUserFn } from '#modules/users/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import type { DocumentTimelineEntry } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type GetDocumentTimelineFnResult =
  | Readonly<{ ok: true; data: readonly DocumentTimelineEntry[] }>
  | Readonly<{ ok: false; error: FinancialError }>

export const getDocumentTimelineFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.uuid() }))
  .handler(async ({ data }): Promise<GetDocumentTimelineFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().getDocumentTimeline(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    const events = r.value

    // Resolve o nome de cada autor DISTINTO (poucos por trilha) via Users. Best-effort: falha → null.
    const actorIds = [...new Set(events.map((e) => e.actor).filter((a): a is string => a !== null))]
    const nameByActor = new Map<string, string>()
    await Promise.all(
      actorIds.map(async (id) => {
        const u = await getUserFn({ data: { id } })
        if (u.ok) nameByActor.set(id, u.data.name)
      }),
    )

    const entries: readonly DocumentTimelineEntry[] = events.map((e) => ({
      eventType: e.eventType,
      targetKind: e.targetKind,
      targetId: e.targetId,
      occurredAt: e.occurredAt,
      isSystem: e.actor === null,
      actorName: e.actor !== null ? (nameByActor.get(e.actor) ?? null) : null,
      changes: e.changes,
    }))
    return { ok: true, data: entries }
  })
