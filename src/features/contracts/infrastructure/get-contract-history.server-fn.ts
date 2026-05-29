import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { serverFetch } from '@/server/http/result-fetch'
import { authMiddleware } from '@/server/middleware/auth'
import { GetByIdSchema } from '../domain/schemas'
import { buildContractTimeline } from '../domain/timeline'
import type { TimelineItem } from '../domain/timeline'
import { ContractId } from '../domain/types'

const backendHistoryEventSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  userName: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

const backendHistoryResponseSchema = z.object({
  contractId: z.string().uuid(),
  events: z.array(backendHistoryEventSchema).default([]),
})

export const getContractHistory = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(GetByIdSchema)
  .handler(async ({ data, context }) => {
    const result = await serverFetch<unknown>(`/contracts/${data.id}/history`, {
      headers: {
        authorization: `Bearer ${context.accessToken}`,
      },
    })

    if (result.isErr()) {
      if (result.error.kind === 'http' && result.error.status === 404) {
        throw new Response('Contrato não encontrado', { status: 404 })
      }
      if (result.error.kind === 'http' && result.error.status === 403) {
        throw new Response('Sem permissão', { status: 403 })
      }
      if (result.error.kind === 'http') {
        throw new Response(JSON.stringify(result.error.body), { status: result.error.status })
      }
      throw new Response('Failed to fetch contract history', { status: 500 })
    }

    const parsed = backendHistoryResponseSchema.safeParse(result.value)
    if (!parsed.success) {
      // Fallback: tenta usar a resposta como array de eventos diretamente
      const fallbackEvents = Array.isArray(result.value) ? result.value : []
      const timeline = fallbackEvents.map((event: any): TimelineItem => ({
        id: event.id || crypto.randomUUID(),
        title: event.type || 'Evento',
        subtitle: event.description || '—',
        date: event.createdAt
          ? new Date(event.createdAt).toLocaleDateString('pt-BR')
          : '—',
        status: 'past',
        kind: 'base',
      }))
      return { contractId: data.id, timeline }
    }

    const dto = parsed.data

    const timeline: TimelineItem[] = dto.events.map((event) => ({
      id: event.id || crypto.randomUUID(),
      title: mapEventType(event.type),
      subtitle: event.description || '—',
      date: event.createdAt
        ? new Date(event.createdAt).toLocaleDateString('pt-BR')
        : '—',
      status: 'past',
      kind: 'base',
      badge: event.userName || undefined,
    }))

    return { contractId: ContractId(dto.contractId), timeline }
  })

function mapEventType(type: string): string {
  const map: Record<string, string> = {
    created: 'Contrato criado',
    updated: 'Contrato atualizado',
    signed: 'Contrato assinado',
    activated: 'Contrato ativado',
    terminated: 'Contrato encerrado',
    amendment_created: 'Aditivo criado',
    amendment_homologated: 'Aditivo homologado',
    document_uploaded: 'Documento anexado',
    payment_made: 'Pagamento realizado',
  }
  return map[type] || type
}
