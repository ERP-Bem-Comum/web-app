/**
 * ViewModel PURO da trilha de auditoria (Histórico do drawer) — sem React. Deriva a apresentação de cada
 * evento (rótulo i18n, ícone, tom) e formata data/hora + os diffs de campo. A View só apresenta o que recebe.
 */
import type {
  DocumentTimelineEntry,
  TimelineEventType,
} from '#modules/financial/client/data/model/document.model.ts'
import type { CategorizationResolvers } from './contas-a-pagar.view-model.ts'

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
    // Spec 119: baixa desfeita — tom "approved" (o título volta a Aprovado/Transmitido, nunca a Aberto).
    case 'ManualPaymentUndone':
      return { labelTag: 'financial.timeline.event.paymentUndone', tone: 'approved' }
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
// `resolved` (spec 125) = o valor cru é um código (forma de pagamento) ou um id (categorização) que só o
// binding sabe traduzir em nome → passa pelo `TimelineValueResolver`.
type ChangeKind = 'date' | 'money' | 'status' | 'text' | 'resolved'
const FIELD_CONFIG: Readonly<Record<string, { labelTag: string; kind: ChangeKind }>> = {
  dueDate: { labelTag: 'financial.timeline.field.dueDate', kind: 'date' },
  grossValue: { labelTag: 'financial.timeline.field.grossValue', kind: 'money' },
  value: { labelTag: 'financial.timeline.field.grossValue', kind: 'money' },
  status: { labelTag: 'financial.timeline.field.status', kind: 'status' },
  description: { labelTag: 'financial.timeline.field.description', kind: 'text' },
  paymentMethod: { labelTag: 'financial.timeline.field.paymentMethod', kind: 'resolved' },
  // spec 125: complemento e categorização (a reclassificação da conciliação já os grava; eram descartados).
  paymentDetail: { labelTag: 'financial.timeline.field.paymentDetail', kind: 'text' },
  programRef: { labelTag: 'financial.timeline.field.programRef', kind: 'resolved' },
  budgetPlanRef: { labelTag: 'financial.timeline.field.budgetPlanRef', kind: 'resolved' },
  costCenterRef: { labelTag: 'financial.timeline.field.costCenterRef', kind: 'resolved' },
  categoryRef: { labelTag: 'financial.timeline.field.categoryRef', kind: 'resolved' },
  subcategoryRef: { labelTag: 'financial.timeline.field.subcategoryRef', kind: 'resolved' },
}

/**
 * Traduz o valor cru de um campo `resolved` (código/id) para o texto exibido. Quem monta é o binding (tem o
 * catálogo i18n e a taxonomia). Sem resolver → o valor cru (nunca quebra).
 */
export type TimelineValueResolver = (field: string, raw: string) => string

/**
 * Resolver padrão (spec 125): forma de pagamento → nome i18n; refs da categorização → nome pela MESMA
 * resolução do drawer (plano carimbado primeiro, catálogo operacional de fallback). Ref que não resolve (p.ex.
 * de um plano anterior à reclassificação) → "não identificado", nunca o UUID cru. PURA (recebe o `t`).
 */
export const buildTimelineValueResolver =
  (r: CategorizationResolvers, t: (key: string) => string): TimelineValueResolver =>
  (field, raw) => {
    const unresolved = t('financial.timeline.value.unresolved')
    switch (field) {
      case 'paymentMethod': {
        const tag = `financial.paymentMethod.${raw}`
        const label = t(tag)
        return label === tag ? raw : label
      }
      case 'programRef':
        return r.program(raw) ?? unresolved
      case 'budgetPlanRef':
        return r.budgetPlan(raw) ?? unresolved
      case 'costCenterRef':
        return r.costCenter(raw) ?? unresolved
      case 'categoryRef':
      case 'subcategoryRef':
        return r.categoryNode(raw)?.name ?? unresolved
      default:
        return raw
    }
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
const formatChangeValue = (
  kind: ChangeKind,
  field: string,
  raw: string | null,
  resolve: TimelineValueResolver | undefined,
): string => {
  if (raw === null || raw === '') return '—'
  switch (kind) {
    case 'resolved':
      return resolve !== undefined ? resolve(field, raw) : raw
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
  reason: string | null // spec 119: o porquê do marco (desfazimentos); null → a View não mostra a linha
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
      reason: null,
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
export const deriveTimelineRows = (
  entries: readonly DocumentTimelineEntry[],
  resolve?: TimelineValueResolver,
): readonly TimelineRow[] =>
  byOccurredAtDesc(entries).map((e, i) => ({
    key: `${e.eventType}-${e.occurredAt}-${String(i)}`,
    eventType: e.eventType,
    presentation: timelineEventPresentation(e.eventType),
    targetKind: e.targetKind,
    targetId: e.targetId,
    dateLabel: formatTimelineDate(e.occurredAt),
    isSystem: e.isSystem,
    actorName: e.actorName,
    reason: e.reason,
    // Só campos conhecidos entram; valores já formatados (data/dinheiro/status/texto).
    changes: e.changes.reduce<TimelineChangeRow[]>((acc, c) => {
      const cfg = FIELD_CONFIG[c.field]
      if (cfg !== undefined) {
        acc.push({
          labelTag: cfg.labelTag,
          fieldRaw: c.field,
          before: formatChangeValue(cfg.kind, c.field, c.before, resolve),
          after: formatChangeValue(cfg.kind, c.field, c.after, resolve),
        })
      }
      return acc
    }, []),
  }))
