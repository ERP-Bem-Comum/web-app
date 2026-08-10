/**
 * ViewModel PURO da trilha de auditoria (Histórico do drawer) — sem React. Deriva a apresentação de cada
 * evento (rótulo i18n, ícone, tom) e formata data/hora + os diffs de campo. A View só apresenta o que recebe.
 */
import type {
  DocumentTimelineEntry,
  TimelineEventType,
} from '#modules/financial/client/data/model/document.model.ts'

// Tom do nó = COR DO STATUS que o evento representa (paridade com os pills de status do grid):
// paid=verde (active) · approved=azul · reconciled=roxo · open=âmbar (pending) · draft=cinza (cancelled).
export type TimelineTone = 'paid' | 'approved' | 'reconciled' | 'open' | 'draft'

export type TimelineEventPresentation = Readonly<{
  labelTag: string
  tone: TimelineTone
}>

/** Mapa evento → apresentação (rótulo + tom de status). Exaustivo sobre os 5 tipos. */
export const timelineEventPresentation = (type: TimelineEventType): TimelineEventPresentation => {
  switch (type) {
    case 'PayableManuallyPaid':
      return { labelTag: 'financial.timeline.event.paid', tone: 'paid' }
    case 'PayableApproved':
      return { labelTag: 'financial.timeline.event.approved', tone: 'approved' }
    case 'ApprovalUndone':
      return { labelTag: 'financial.timeline.event.undone', tone: 'open' } // reverte p/ Aberto
    case 'DocumentSaved':
      return { labelTag: 'financial.timeline.event.saved', tone: 'open' } // lançado → Aberto
    case 'DocumentDraftSaved':
      return { labelTag: 'financial.timeline.event.draft', tone: 'draft' }
    case 'PayableReconciled':
      return { labelTag: 'financial.timeline.event.reconciled', tone: 'reconciled' }
    case 'ReconciliationUndone':
      return { labelTag: 'financial.timeline.event.reconciliationUndone', tone: 'open' } // desfaz → volta a Pago
  }
}

// A trilha é sobre os TÍTULOS (o documento é só como eles nascem). A tag identifica o título: o PAI usa o
// tipo do documento (NFS-e, DANFE…); os FILHOS usam a retenção (ISS, IRRF…). Eventos de nível-documento
// (lançado/rascunho) são atribuídos ao título-pai.
export type TimelineTargetPayable = Readonly<{
  id: string
  isParent: boolean
  retentionType: string | null
  isReconciled: boolean // status atual = Conciliado (espelhado do detalhe enquanto core-api#406 não traz o evento)
}>

/** Rótulo do título afetado: retenção (filho) ou o tipo do documento (pai / evento de documento). */
export const resolveTimelineTitle = (
  targetKind: 'Document' | 'Payable',
  targetId: string,
  payables: readonly TimelineTargetPayable[],
  documentType: string,
): string => {
  if (targetKind === 'Document') return documentType
  const p = payables.find((x) => x.id === targetId)
  if (p === undefined || p.isParent) return documentType
  return p.retentionType ?? documentType
}

// Só os campos ÚTEIS ao humano aparecem no diff; os técnicos (supplierRef/documentNumber/type/netValue…)
// são descartados. Cada campo tem rótulo i18n + como formatar o valor (data/dinheiro/status/texto).
type ChangeKind = 'date' | 'money' | 'status' | 'text'
const FIELD_CONFIG: Readonly<Record<string, { labelTag: string; kind: ChangeKind }>> = {
  dueDate: { labelTag: 'financial.timeline.field.dueDate', kind: 'date' },
  grossValue: { labelTag: 'financial.timeline.field.grossValue', kind: 'money' },
  value: { labelTag: 'financial.timeline.field.grossValue', kind: 'money' },
  status: { labelTag: 'financial.timeline.field.status', kind: 'status' },
  description: { labelTag: 'financial.timeline.field.description', kind: 'text' },
  paymentMethod: { labelTag: 'financial.timeline.field.paymentMethod', kind: 'text' },
}
/** Campo tem apresentação amigável? (define se entra na timeline). */
export const isTimelineFieldKnown = (field: string): boolean => field in FIELD_CONFIG

const STATUS_PT: Readonly<Record<string, string>> = {
  Draft: 'Rascunho',
  Open: 'Aberto',
  Approved: 'Aprovado',
  Transmitted: 'Transmitido',
  Refused: 'Recusado',
  Paid: 'Pago',
  Reconciled: 'Conciliado',
}
// timeZone UTC: o vencimento é uma DATA de calendário (meia-noite UTC) — sem UTC, o fuso local a joga p/ o
// dia anterior. (O `occurredAt`, um instante real, segue no fuso local via `formatTimelineDate`.)
const dateOnlyFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})
const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Formata o valor cru conforme o tipo do campo; nulo → "—"; não-parseável → o próprio valor cru (nunca quebra).
const formatChangeValue = (kind: ChangeKind, raw: string | null): string => {
  if (raw === null || raw === '') return '—'
  switch (kind) {
    case 'date': {
      const d = new Date(raw)
      return Number.isNaN(d.getTime()) ? raw : dateOnlyFmt.format(d)
    }
    case 'money': {
      const cents = Number(raw)
      return Number.isFinite(cents) ? moneyFmt.format(cents / 100) : raw
    }
    case 'status':
      return STATUS_PT[raw] ?? raw
    case 'text':
      return raw
  }
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Formata ISO → "DD/MM/AAAA HH:mm"; ISO inválido → string vazia (a View decide o fallback). */
export const formatTimelineDate = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : dateFmt.format(d).replace(', ', ' ')
}

export type TimelineChangeRow = Readonly<{
  labelTag: string // rótulo i18n do campo (a View traduz)
  fieldRaw: string // chave estável p/ o React
  before: string // já formatado ("—" quando ausente)
  after: string
}>

export type TimelineRow = Readonly<{
  key: string
  eventType: TimelineEventType
  presentation: TimelineEventPresentation
  targetKind: 'Document' | 'Payable'
  targetId: string
  dateLabel: string // "—" quando a data não é conhecida (nó sintetizado do status)
  isSystem: boolean // true → a View mostra "Sistema"
  actorName: string | null // humano não-resolvido (isSystem=false) → a View mostra "—"
  changes: readonly TimelineChangeRow[]
}>

// Nó de "Conciliado" SINTETIZADO a partir do status atual do título (o detalhe já expõe `status` por título).
// Ponte honesta enquanto o core-api#406 não grava o evento na trilha: o status É real; a DATA não é conhecida
// aqui (→ "—"). Suprimido para um título que JÁ tenha o evento real (`PayableReconciled`) — evita duplicar
// quando o #406 subir. Fica no TOPO (conciliação é a etapa terminal, após Pago).
export const deriveReconciledTitleRows = (
  payables: readonly TimelineTargetPayable[],
  existingRows: readonly TimelineRow[],
): readonly TimelineRow[] => {
  const hasRealEvent = new Set(
    existingRows.filter((r) => r.eventType === 'PayableReconciled').map((r) => r.targetId),
  )
  return payables
    .filter((p) => p.isReconciled && !hasRealEvent.has(p.id))
    .map((p) => ({
      key: `reconciled-${p.id}`,
      eventType: 'PayableReconciled' as const,
      presentation: timelineEventPresentation('PayableReconciled'),
      targetKind: 'Payable' as const,
      targetId: p.id,
      dateLabel: '—', // data real vem no core-api#406
      isSystem: false,
      actorName: null, // "—" na View (autor não conhecido sem o evento real)
      changes: [],
    }))
}

// Ordena por data DECRESCENTE (mais recente no TOPO — convenção de trilha de auditoria), independente da
// ordem que o backend enviar. Empate de instante mantém a ordem original (estável).
const byOccurredAtDesc = (entries: readonly DocumentTimelineEntry[]): readonly DocumentTimelineEntry[] =>
  [...entries]
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const d = new Date(b.e.occurredAt).getTime() - new Date(a.e.occurredAt).getTime()
      return d !== 0 ? d : a.i - b.i
    })
    .map(({ e }) => e)

/** Deriva as linhas da timeline, ordenadas do mais recente ao mais antigo. */
export const deriveTimelineRows = (entries: readonly DocumentTimelineEntry[]): readonly TimelineRow[] =>
  byOccurredAtDesc(entries).map((e, i) => ({
    key: `${e.eventType}-${e.occurredAt}-${String(i)}`,
    eventType: e.eventType,
    presentation: timelineEventPresentation(e.eventType),
    targetKind: e.targetKind,
    targetId: e.targetId,
    dateLabel: formatTimelineDate(e.occurredAt),
    isSystem: e.isSystem,
    actorName: e.actorName,
    // Só campos conhecidos entram; valores já formatados (data/dinheiro/status/texto).
    changes: e.changes.reduce<TimelineChangeRow[]>((acc, c) => {
      const cfg = FIELD_CONFIG[c.field]
      if (cfg !== undefined) {
        acc.push({
          labelTag: cfg.labelTag,
          fieldRaw: c.field,
          before: formatChangeValue(cfg.kind, c.before),
          after: formatChangeValue(cfg.kind, c.after),
        })
      }
      return acc
    }, []),
  }))
