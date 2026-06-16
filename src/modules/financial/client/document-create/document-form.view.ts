/**
 * Derivação PURA do form de Lançar Documento (§XI: lógica fora da view; sem React). Preview do líquido,
 * gating de retenção (NFS-e/RPA), **agregação CSRF** (PIS+COFINS+CSLL → 1 filho) e build do
 * `CreateDocumentInput`. Money via `money.ts`. No v1, descontos/multa/juros = 0 (sem campos no form).
 */
import { reaisToCents } from '#modules/financial/client/data/money.ts'
import type {
  CreateDocumentInput,
  DocumentType,
  PaymentMethod,
  RetentionInput,
  RetentionType,
} from '#modules/financial/client/data/model/document.model.ts'

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
  const csrf = toCents(fields.retentions.pis) + toCents(fields.retentions.cofins) + toCents(fields.retentions.csll)
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
