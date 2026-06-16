/**
 * Derivação PURA do form de Lançar Documento (§XI: lógica fora da view; sem React). Preview do líquido,
 * gating de retenção (NFS-e/RPA), **agregação CSRF** (PIS+COFINS+CSLL → 1 filho) e build do
 * `CreateDocumentInput`. Money via `money.ts`. No v1, descontos/multa/juros = 0 (sem campos no form).
 */
import { reaisToCents, centsToBRL } from '#modules/financial/client/data/money.ts'
import type {
  CreateDocumentInput,
  DocumentType,
  PaymentMethod,
  RetentionInput,
  RetentionType,
} from '#modules/financial/client/data/model/document.model.ts'

// Re-export dos tipos que a UI precisa — as views importam SÓ do view-model (§XI), nunca de client-data.
export type {
  DocumentType,
  PaymentMethod,
  RetentionType,
} from '#modules/financial/client/data/model/document.model.ts'
export type SupplierOption = Readonly<{ id: string; name: string }>

// Parceiro selecionável no picker do hero (Fornecedor/Financiador/Ato). `supplierRef` do documento
// guarda o `id`. ⚠️ Hoje o core-api só aceita Fornecedor em supplierRef (não-fornecedor → erro no salvar
// até o backend evoluir — ver issue). Colaborador não tem list-fn na public-api → fora do picker.
export type PartnerKind = 'supplier' | 'financier' | 'act'
// `subtitle` = linha secundária no picker: CNPJ (fornecedor/financiador) ou nº do ato (ato).
export type PartnerOption = Readonly<{ id: string; name: string; subtitle: string; kind: PartnerKind }>

/** Rótulo i18n do tipo de parceiro. */
export const partnerKindTag = (kind: PartnerKind): string => `financial.create.partner.kind.${kind}`

/** 14 dígitos → CNPJ mascarado (xx.xxx.xxx/xxxx-xx); senão devolve como veio (ex.: nº de ato). */
export const maskCnpj = (value: string): string => {
  const d = value.replace(/\D/g, '')
  if (d.length !== 14) return value
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}
/** Parceiro é PJ quando o subtítulo é um CNPJ (14 dígitos). */
export const isCnpj = (value: string): boolean => value.replace(/\D/g, '').length === 14

/** Filtro PURO do picker: casa por nome ou subtítulo (CNPJ/nº) — case-insensitive, ignora pontuação. */
export const filterPartners = (
  options: readonly PartnerOption[],
  query: string,
): readonly PartnerOption[] => {
  const q = query.trim().toLowerCase()
  if (q === '') return options
  const hasLetters = /[a-z]/.test(q)
  const digits = q.replace(/\D/g, '')
  return options.filter((o) => {
    if (o.name.toLowerCase().includes(q)) return true
    if (o.subtitle.toLowerCase().includes(q)) return true
    // Busca por dígitos (CNPJ) só quando a query é numérica — evita "014" casar dentro de outro CNPJ.
    if (!hasLetters && digits !== '' && o.subtitle.replace(/\D/g, '').includes(digits)) return true
    return false
  })
}

export type RetentionFieldsReais = Readonly<{
  iss: string
  irrf: string
  inss: string
  pis: string
  cofins: string
  csll: string
}>

export type DocumentFormFields = Readonly<{
  type: DocumentType | ''
  documentNumber: string
  series: string
  supplierRef: string
  paymentMethod: PaymentMethod | ''
  grossValue: string
  dueDate: string
  description: string
  retentions: RetentionFieldsReais
}>

export type TituloPreview = Readonly<{ kind: 'Pai' | RetentionType; valueCents: string }>

export const EMPTY_RETENTIONS: RetentionFieldsReais = {
  iss: '',
  irrf: '',
  inss: '',
  pis: '',
  cofins: '',
  csll: '',
}

const toCents = (reais: string): number => {
  const r = reaisToCents(reais)
  return r.ok ? Number.parseInt(r.value, 10) : 0
}

/** Retenções só valem para NFS-e e RPA (gating; backend recusa o resto → retention-not-allowed). */
export const retentionsEnabledFor = (type: DocumentType | ''): boolean => type === 'NFS-e' || type === 'RPA'

type RetentionTotals = Readonly<{ iss: number; irrf: number; inss: number; csrf: number; sum: number }>

const retentionTotals = (fields: DocumentFormFields): RetentionTotals => {
  if (!retentionsEnabledFor(fields.type)) return { iss: 0, irrf: 0, inss: 0, csrf: 0, sum: 0 }
  const iss = toCents(fields.retentions.iss)
  const irrf = toCents(fields.retentions.irrf)
  const inss = toCents(fields.retentions.inss)
  // CSRF agrega PIS + COFINS + CSLL num único filho (R8 do domain.md).
  const csrf =
    toCents(fields.retentions.pis) + toCents(fields.retentions.cofins) + toCents(fields.retentions.csll)
  return { iss, irrf, inss, csrf, sum: iss + irrf + inss + csrf }
}

const grossCents = (fields: DocumentFormFields): number => toCents(fields.grossValue)

/** Líquido = Bruto − Σretenções (v1: descontos/multa/juros = 0). String de centavos. */
export const netPreviewCents = (fields: DocumentFormFields): string =>
  String(grossCents(fields) - retentionTotals(fields).sum)

/** Títulos previstos: pai (líquido) + 1 filho por retenção (ISS/IRRF/INSS/CSRF), só os > 0. */
export const titulosPrevistos = (fields: DocumentFormFields): readonly TituloPreview[] => {
  const t = retentionTotals(fields)
  const filhos: TituloPreview[] = []
  if (t.iss > 0) filhos.push({ kind: 'ISS', valueCents: String(t.iss) })
  if (t.irrf > 0) filhos.push({ kind: 'IRRF', valueCents: String(t.irrf) })
  if (t.inss > 0) filhos.push({ kind: 'INSS', valueCents: String(t.inss) })
  if (t.csrf > 0) filhos.push({ kind: 'CSRF', valueCents: String(t.csrf) })
  return [{ kind: 'Pai', valueCents: String(grossCents(fields) - t.sum) }, ...filhos]
}

/** Destino (órgão arrecadador) de cada filho — i18n key. ISS = município; demais = federal. */
export const tituloDestino = (kind: 'Pai' | RetentionType): string =>
  kind === 'ISS' ? 'financial.create.titulos.dest.iss' : 'financial.create.titulos.dest.federal'

export type ValidationState = 'ok' | 'aviso' | 'pendente'
export type ValidationItem = Readonly<{ key: string; tag: string; state: ValidationState }>

/**
 * Checklist de Validação (sidebar, Figma). Os dois primeiros itens são DERIVADOS do form (fornecedor
 * identificado, cálculo bruto→líquido íntegro) e o aviso de ISS divergente só aparece quando há ISS;
 * "dados bancários" e "aguarda aprovação" são CHROME (sem backend de validação/aprovação no v1).
 */
export const validationChecklist = (
  fields: DocumentFormFields,
  supplierName: string,
): readonly ValidationItem[] => {
  const hasSupplier = supplierName.trim() !== '' && fields.supplierRef.trim() !== ''
  const t = retentionTotals(fields)
  const net = grossCents(fields) - t.sum
  const calcOk = grossCents(fields) > 0 && net > 0
  const items: ValidationItem[] = [
    {
      key: 'supplier',
      tag: 'financial.create.validation.supplier',
      state: hasSupplier ? 'ok' : 'pendente',
    },
    { key: 'calc', tag: 'financial.create.validation.calc', state: calcOk ? 'ok' : 'pendente' },
    { key: 'bank', tag: 'financial.create.validation.bank', state: 'ok' }, // chrome
  ]
  if (t.iss > 0) {
    items.push({ key: 'iss', tag: 'financial.create.validation.issDivergent', state: 'aviso' }) // chrome
  }
  items.push({ key: 'approval', tag: 'financial.create.validation.approval', state: 'pendente' }) // chrome
  return items
}

export const canSubmit = (fields: DocumentFormFields): boolean => {
  const gross = grossCents(fields)
  const net = gross - retentionTotals(fields).sum
  return (
    fields.type !== '' &&
    fields.documentNumber.trim() !== '' &&
    fields.supplierRef.trim() !== '' &&
    fields.paymentMethod !== '' &&
    gross > 0 &&
    fields.dueDate.trim() !== '' &&
    net > 0
  )
}

const retentionInput = (type: RetentionType, valueCents: number, base: number): RetentionInput => ({
  type,
  baseCents: String(base),
  rateBps: base > 0 ? Math.round((valueCents / base) * 10000) : 0,
  valueCents: String(valueCents),
})

const trimToUndefined = (s: string): string | undefined => (s.trim() === '' ? undefined : s.trim())

/** Monta o CreateDocumentInput (com agregação CSRF) ou `null` se o form ainda não pode submeter. */
export const buildCreateInput = (fields: DocumentFormFields): CreateDocumentInput | null => {
  if (!canSubmit(fields) || fields.type === '' || fields.paymentMethod === '') return null
  const gross = grossCents(fields)
  const t = retentionTotals(fields)
  const retentions: RetentionInput[] = []
  if (t.iss > 0) retentions.push(retentionInput('ISS', t.iss, gross))
  if (t.irrf > 0) retentions.push(retentionInput('IRRF', t.irrf, gross))
  if (t.inss > 0) retentions.push(retentionInput('INSS', t.inss, gross))
  if (t.csrf > 0) retentions.push(retentionInput('CSRF', t.csrf, gross))
  return {
    type: fields.type,
    documentNumber: fields.documentNumber.trim(),
    series: trimToUndefined(fields.series),
    supplierRef: fields.supplierRef,
    paymentMethod: fields.paymentMethod,
    grossValueCents: String(gross),
    retentions,
    registeredTaxes: [],
    dueDate: fields.dueDate,
    description: trimToUndefined(fields.description),
  }
}

// ── Opções / guards / formatação para as views (§XI: a view importa só daqui) ────
export const DOCUMENT_TYPES: readonly DocumentType[] = [
  'NFS-e',
  'DANFE',
  'RPA',
  'Fatura',
  'Boleto',
  'Recibo',
  'Imposto',
]
export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'TED',
  'TransferenciaBancaria',
  'PIX',
  'Boleto',
  'CartaoCorporativo',
  'Cambio',
  'GuiaRecolhimento',
  'Outro',
]
export const RETENTION_KEYS: readonly (keyof RetentionFieldsReais)[] = [
  'iss',
  'irrf',
  'inss',
  'pis',
  'cofins',
  'csll',
]

export const isDocumentType = (v: string): v is DocumentType =>
  (DOCUMENT_TYPES as readonly string[]).includes(v)
export const isPaymentMethod = (v: string): v is PaymentMethod =>
  (PAYMENT_METHODS as readonly string[]).includes(v)

/** Centavos → "R$ x,xx". */
export const formatCents = (cents: string): string => centsToBRL(cents)
/** Reais (com máscara) → "R$ x,xx" (0 quando inválido/vazio). */
export const formatReaisBRL = (reais: string): string => {
  const c = reaisToCents(reais)
  return centsToBRL(c.ok ? c.value : '0')
}
/** YYYY-MM-DD → DD/MM/YYYY (sem Date — evita recuo de fuso). */
export const formatDue = (iso: string): string => {
  const p = iso.split('-')
  return p.length === 3 ? `${p[2] ?? ''}/${p[1] ?? ''}/${p[0] ?? ''}` : iso
}
