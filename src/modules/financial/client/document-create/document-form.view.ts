/**
 * Derivação PURA do form de Lançar Documento (§XI: lógica fora da view; sem React). Preview do líquido,
 * gating de retenção (NFS-e/RPA), **agregação CSRF** (PIS+COFINS+CSLL → 1 filho) e build do
 * `CreateDocumentInput`. Money via `money.ts`. No v1, descontos/multa/juros = 0 (sem campos no form).
 */
import { reaisToCents, centsToBRL, centsToReais, maskMoneyBRL } from '#modules/financial/client/data/money.ts'
import { normalizeCnpj, isCnpjLength, maskCnpj as maskCnpjDoc, maskCpfCnpj } from '#shared/document/cnpj.ts'
import type {
  CreateDocumentInput,
  AdjustDocumentInput,
  DocumentDetail,
  DocumentStatus,
  DocumentType,
  PaymentMethod,
  RetentionInput,
  RetentionType,
  RegisteredTaxInput,
  RegisteredTaxType,
} from '#modules/financial/client/data/model/document.model.ts'

// Re-export dos tipos que a UI precisa — as views importam SÓ do view-model (§XI), nunca de client-data.
export type {
  DocumentType,
  PaymentMethod,
  RetentionType,
  RegisteredTaxType,
} from '#modules/financial/client/data/model/document.model.ts'
export type SupplierOption = Readonly<{ id: string; name: string }>

// Parceiro selecionável no picker do hero (Fornecedor/Financiador/Ato/Colaborador). `supplierRef` do
// documento guarda só o `id` (UUID); o core-api persiste qualquer UUID (sem FK/validação de tipo) e o
// FRONT resolve o nome/documento client-side via partners-map (o read-model do backend só conhece
// fornecedor — por isso a resolução é nossa). Os 4 tipos funcionam fim-a-fim nesta tela e no grid.
export type PartnerKind = 'supplier' | 'financier' | 'act' | 'collaborator'
// `subtitle` = linha secundária no picker: CNPJ (PJ: fornecedor/financiador/ato) ou e-mail (colaborador, PF).
export type PartnerOption = Readonly<{ id: string; name: string; subtitle: string; kind: PartnerKind }>

/** Rótulo i18n do tipo de parceiro. */
export const partnerKindTag = (kind: PartnerKind): string => `financial.create.partner.kind.${kind}`

/** CNPJ (14, alfanumérico Serpro/2026) → mascarado; senão devolve como veio (ex.: nº de ato). */
export const maskCnpj = (value: string): string => (isCnpjLength(value) ? maskCnpjDoc(value) : value)
/** Parceiro é PJ quando o subtítulo é um CNPJ (14 caracteres alfanuméricos). */
export const isCnpj = (value: string): boolean => isCnpjLength(value)

/** Documento do parceiro mascarado por conteúdo: CPF (colaborador, PF) ou CNPJ (PJ). */
export const maskDocument = (value: string): string => maskCpfCnpj(value)
/** PF (pessoa física) = colaborador; os demais tipos são PJ. Define badge ("PF/PJ") e rótulo do documento. */
export const isPartnerPF = (kind: PartnerKind): boolean => kind === 'collaborator'

// ── Hidratação do fornecedor: dados bancários + contrato "Em Andamento" (auto-preenchimento) ──────
export type SupplierBankView = Readonly<{ line: string; pix: string | null }>
export type ContractCategoView = Readonly<{
  ref: string // contractRef (uuid) — enviado no create; backend deriva a categorização (#48)
  number: string // sequentialNumber (ex.: 0001/2026)
  centroCusto: string
  categoria: string
  programa: string
  planoOrcamentario: string
  programRef: string | null
  budgetPlanRef: string | null
}>
export type PartnerHydration = Readonly<{
  bank: SupplierBankView | null
  contract: ContractCategoView | null
}>
export const EMPTY_HYDRATION: PartnerHydration = { bank: null, contract: null }

/** Filtro PURO do picker: casa por nome ou subtítulo (CNPJ/nº) — case-insensitive, ignora pontuação. */
export const filterPartners = (
  options: readonly PartnerOption[],
  query: string,
): readonly PartnerOption[] => {
  const q = query.trim().toLowerCase()
  if (q === '') return options
  // Documento normalizado (CNPJ alfanumérico Serpro/2026 ou numérico) — sem pontuação, maiúsculo.
  const docQuery = normalizeCnpj(query.trim())
  return options.filter((o) => {
    if (o.name.toLowerCase().includes(q)) return true
    if (o.subtitle.toLowerCase().includes(q)) return true
    // Busca por documento ignorando pontuação/caixa (casa CNPJ alfanumérico parcial).
    if (docQuery !== '' && normalizeCnpj(o.subtitle).includes(docQuery)) return true
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

// Reforma Tributária (CBS/IBS) — campos de **registro de valor apenas** (OCR preenche ou manual). Por
// regra documentada (specs/FIN-DOCUMENTO-INGESTAO, domain R5): NÃO geram filho, NÃO viram retenção e
// NÃO abatem do líquido — só são enviados em `registeredTaxes[]` p/ auditoria fiscal.
export type ReformaTributariaFieldsReais = Readonly<{
  cbs: string
  ibsMunicipal: string
  ibsEstadual: string
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
  reformaTributaria: ReformaTributariaFieldsReais
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

export const EMPTY_REFORMA_TRIBUTARIA: ReformaTributariaFieldsReais = {
  cbs: '',
  ibsMunicipal: '',
  ibsEstadual: '',
}

const toCents = (reais: string): number => {
  const r = reaisToCents(reais)
  return r.ok ? Number.parseInt(r.value, 10) : 0
}

/** Retenções só valem para NFS-e e RPA (gating; backend recusa o resto → retention-not-allowed). */
export const retentionsEnabledFor = (type: DocumentType | ''): boolean => type === 'NFS-e' || type === 'RPA'

/**
 * ISS é retenção EXCLUSIVA de NFS-e. RPA aceita só IRRF/INSS/CSRF (espelha `ALLOWED_RETENTIONS` do
 * core-api: NFS-e={ISS,IRRF,INSS,CSRF}, RPA={IRRF,INSS,CSRF}). Enviar ISS num RPA → 422
 * `retention-not-allowed-for-type`. Por isso o campo ISS não aparece (nem entra no cálculo) em RPA.
 */
export const issAllowedFor = (type: DocumentType | ''): boolean => type === 'NFS-e'

/**
 * Reforma Tributária (CBS/IBS) — campos de registro de valor. Documentos fiscais de serviço (NFS-e/RPA)
 * exibem CBS/IBS conforme a tabela do domínio. São SÓ registro: não geram filho nem abatem o líquido.
 */
export const reformaTributariaEnabledFor = (type: DocumentType | ''): boolean =>
  type === 'NFS-e' || type === 'RPA'

type RetentionTotals = Readonly<{ iss: number; irrf: number; inss: number; csrf: number; sum: number }>

const retentionTotals = (fields: DocumentFormFields): RetentionTotals => {
  if (!retentionsEnabledFor(fields.type)) return { iss: 0, irrf: 0, inss: 0, csrf: 0, sum: 0 }
  // ISS só conta para NFS-e (RPA não aceita ISS → ignora valor herdado p/ não cair em 422 no backend).
  const iss = issAllowedFor(fields.type) ? toCents(fields.retentions.iss) : 0
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

/**
 * Alíquota % DERIVADA de uma retenção (valor ÷ bruto), p/ exibir ao lado do rótulo na Composição
 * (Figma: "ISS (3,5%)"). `''` quando não computável (bruto ou valor ≤ 0). Formata em pt-BR.
 */
export const retentionRatePct = (fields: DocumentFormFields, key: keyof RetentionFieldsReais): string => {
  const gross = grossCents(fields)
  const value = toCents(fields.retentions[key])
  if (gross <= 0 || value <= 0) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 }).format(value / gross)
}

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

const registeredTaxInput = (
  type: RegisteredTaxType,
  valueCents: number,
  base: number,
): RegisteredTaxInput => ({
  type,
  baseCents: String(base),
  rateBps: base > 0 ? Math.round((valueCents / base) * 10000) : 0,
  valueCents: String(valueCents),
})

/**
 * Monta `registeredTaxes[]` da Reforma Tributária (CBS/IBS) — só os campos > 0, base = bruto. Vazio
 * quando o tipo não habilita reforma tributária. NÃO afeta líquido nem gera filho (regra: só registro).
 */
export const buildRegisteredTaxInputs = (fields: DocumentFormFields): readonly RegisteredTaxInput[] => {
  if (!reformaTributariaEnabledFor(fields.type)) return []
  const base = grossCents(fields)
  const out: RegisteredTaxInput[] = []
  const cbs = toCents(fields.reformaTributaria.cbs)
  const ibsM = toCents(fields.reformaTributaria.ibsMunicipal)
  const ibsE = toCents(fields.reformaTributaria.ibsEstadual)
  if (cbs > 0) out.push(registeredTaxInput('CBS', cbs, base))
  if (ibsM > 0) out.push(registeredTaxInput('IBS_Municipal', ibsM, base))
  if (ibsE > 0) out.push(registeredTaxInput('IBS_Estadual', ibsE, base))
  return out
}

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
    registeredTaxes: buildRegisteredTaxInputs(fields),
    dueDate: fields.dueDate,
    description: trimToUndefined(fields.description),
  }
}

/**
 * Pode salvar RASCUNHO? Mínimo que o core-api exige p/ asDraft:true (sem dueDate nem checagem de líquido):
 * tipo, número, fornecedor, forma e bruto > 0.
 */
export const canSaveDraft = (fields: DocumentFormFields): boolean =>
  fields.type !== '' &&
  fields.documentNumber.trim() !== '' &&
  fields.supplierRef.trim() !== '' &&
  fields.paymentMethod !== '' &&
  grossCents(fields) > 0

/** Monta o input de RASCUNHO (asDraft:true) — dueDate é opcional; ou `null` se nem o mínimo está pronto. */
export const buildDraftInput = (fields: DocumentFormFields): CreateDocumentInput | null => {
  if (!canSaveDraft(fields) || fields.type === '' || fields.paymentMethod === '') return null
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
    registeredTaxes: buildRegisteredTaxInputs(fields),
    dueDate: trimToUndefined(fields.dueDate),
    description: trimToUndefined(fields.description),
    asDraft: true,
  }
}

// ── Modo EDIÇÃO ("Editar pagamento" do drawer) ───────────────────────────────────
// O core-api só permite AJUSTAR (PATCH) documentos em "Aberto", e só estes campos: grossValue, dueDate,
// description (+ descontos/encargos/retenções). Os demais são IMUTÁVEIS após a criação → somente-consulta.
// Aqui habilitamos com segurança grossValue/dueDate/description; retenções ficam travadas e OMITIDAS no
// payload (o backend as PRESERVA — confirmado). Status ≠ Aberto → tudo somente-consulta (sem salvar).

/** Trava por campo: `true` = somente-consulta. */
export type FieldLocks = Readonly<{
  type: boolean
  numberSeries: boolean
  supplier: boolean
  paymentMethod: boolean
  grossValue: boolean
  dueDate: boolean
  description: boolean
  retentions: boolean
}>

/** Criação: nada travado. */
export const NO_LOCKS: FieldLocks = {
  type: false,
  numberSeries: false,
  supplier: false,
  paymentMethod: false,
  grossValue: false,
  dueDate: false,
  description: false,
  retentions: false,
}

/** Travas no modo edição conforme o status (só "Aberto" libera os campos ajustáveis). */
export const editLocksFor = (status: DocumentStatus): FieldLocks => {
  const open = status === 'Aberto'
  return {
    // Imutáveis após criação — sempre somente-consulta.
    type: true,
    numberSeries: true,
    supplier: true,
    paymentMethod: true,
    retentions: true,
    // Ajustáveis — liberados apenas em "Aberto".
    grossValue: !open,
    dueDate: !open,
    description: !open,
  }
}

/** Status editável (só "Aberto" pode ser ajustado pelo core-api). */
export const isEditableStatus = (status: DocumentStatus): boolean => status === 'Aberto'

/** Soma (centavos) das retenções existentes do documento (filhos) — p/ validar líquido > 0 ao mudar bruto. */
const retentionSumFromDetail = (d: DocumentDetail): number =>
  d.payables.reduce((acc, p) => {
    if (p.kind !== 'Child') return acc
    const n = Number(p.valueCents) // já está em centavos (não usar reaisToCents)
    return Number.isFinite(n) ? acc + n : acc
  }, 0)

/** DocumentDetail → campos do form (para hidratar a tela de edição). Série não vem no detalhe. */
export const hydrateFieldsFromDetail = (d: DocumentDetail): DocumentFormFields => {
  // ISS/IRRF/INSS hidratam direto. CSRF é agregado (PIS+COFINS+CSLL); como o form soma os três em CSRF,
  // colocamos o total da CSRF em `pis` (cofins/csll = 0) → o LÍQUIDO e os TÍTULOS previstos batem com o
  // documento. (Retenções são somente-consulta na edição e OMITIDAS no PATCH — o backend as preserva; o
  // único efeito é a linha "PIS" da composição exibir o valor da CSRF, read-only.)
  const retVal = (rt: RetentionType): string => {
    const child = d.payables.find((p) => p.kind === 'Child' && p.retentionType === rt)
    return child !== undefined ? centsToReais(child.valueCents) : ''
  }
  const retentions: RetentionFieldsReais = {
    ...EMPTY_RETENTIONS,
    iss: retVal('ISS'),
    irrf: retVal('IRRF'),
    inss: retVal('INSS'),
    pis: retVal('CSRF'),
  }
  return {
    type: d.type ?? '',
    documentNumber: d.documentNumber ?? '',
    series: '',
    supplierRef: d.supplierRef ?? '',
    paymentMethod: d.paymentMethod ?? '',
    grossValue: d.grossValueCents !== null ? centsToReais(d.grossValueCents) : '',
    dueDate: d.dueDate ?? '',
    description: d.description ?? '',
    retentions,
    // Reforma Tributária não vem no GET de detalhe hoje (enriquecimento = core-api#95) e é imutável no
    // ajuste → hidrata vazia. (Quando o detalhe expuser registeredTaxes, mapear aqui.)
    reformaTributaria: EMPTY_REFORMA_TRIBUTARIA,
  }
}

/** Pode salvar o AJUSTE? Bruto > 0, vencimento preenchido e líquido (bruto − retenções atuais) > 0. */
export const canSaveEdit = (fields: DocumentFormFields, detail: DocumentDetail): boolean => {
  const gross = grossCents(fields)
  return gross > 0 && fields.dueDate.trim() !== '' && gross - retentionSumFromDetail(detail) > 0
}

/**
 * Monta o AdjustDocumentInput (PATCH) — só os campos ajustáveis (grossValue/dueDate/description) + version.
 * `retentions` é OMITIDO de propósito (o backend preserva as existentes). `null` se o form não pode salvar.
 */
export const buildAdjustInput = (
  fields: DocumentFormFields,
  detail: DocumentDetail,
): AdjustDocumentInput | null => {
  if (!canSaveEdit(fields, detail)) return null
  return {
    id: detail.id,
    version: detail.version,
    grossValueCents: String(grossCents(fields)),
    dueDate: fields.dueDate,
    description: trimToUndefined(fields.description) ?? null,
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

/** Chaves de retenção exibíveis por tipo: NFS-e = todas; RPA = sem ISS; demais = nenhuma (seção oculta). */
export const allowedRetentionKeysFor = (type: DocumentType | ''): readonly (keyof RetentionFieldsReais)[] => {
  if (!retentionsEnabledFor(type)) return []
  return issAllowedFor(type) ? RETENTION_KEYS : RETENTION_KEYS.filter((k) => k !== 'iss')
}
export const REFORMA_TRIBUTARIA_KEYS: readonly (keyof ReformaTributariaFieldsReais)[] = [
  'cbs',
  'ibsMunicipal',
  'ibsEstadual',
]

// ── Metadata do tipo de documento (modal "Tipo de Documento", Figma) ─────────────
// Classe fiscal exibida como badge: fiscal | parcial | não-fiscal. ⚠️ É a CLASSIFICAÇÃO do documento —
// distinta de "dispara o motor de retenções" (só NFS-e/RPA; DANFE é fiscal mas não dispara no regime atual).
export type FiscalClass = 'fiscal' | 'partial' | 'non-fiscal'

const FISCAL_CLASS: Record<DocumentType, FiscalClass> = {
  'NFS-e': 'fiscal',
  DANFE: 'fiscal',
  RPA: 'fiscal',
  Fatura: 'partial',
  Boleto: 'non-fiscal',
  Recibo: 'non-fiscal',
  Imposto: 'non-fiscal',
}

export type DocumentTypeMeta = Readonly<{
  type: DocumentType
  fiscalClass: FiscalClass
  initials: string
}>

/** Iniciais (2 letras) p/ o avatar do card — derivadas do próprio tipo (sem mapa mágico). */
const initialsOf = (type: DocumentType): string =>
  type
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase()

export const DOCUMENT_TYPE_META: readonly DocumentTypeMeta[] = DOCUMENT_TYPES.map((type) => ({
  type,
  fiscalClass: FISCAL_CLASS[type],
  initials: initialsOf(type),
}))

/** Tag i18n da classe fiscal (badge) e da descrição do tipo (card do modal). */
export const fiscalClassTag = (c: FiscalClass): string => `financial.create.docType.class.${c}`
export const docTypeDescriptionTag = (type: DocumentType): string => `financial.create.docType.desc.${type}`

// ── Metadata da Forma de Pagamento (modal + campos complementares) ───────────────
// A forma escolhida controla o CAMPO COMPLEMENTAR exibido (mock): pix/bank usam a conta herdada do
// fornecedor (card já existente); boleto pede linha digitável; cartão mostra o cartão corporativo.
export type PaymentComplementary = 'pix' | 'boleto' | 'card' | 'bank' | 'currency' | 'free' | 'none'

const PAYMENT_COMPLEMENTARY: Record<PaymentMethod, PaymentComplementary> = {
  PIX: 'pix',
  Boleto: 'boleto',
  TED: 'bank',
  TransferenciaBancaria: 'bank',
  CartaoCorporativo: 'card',
  Cambio: 'currency', // câmbio → moeda/detalhe da conversão
  GuiaRecolhimento: 'none',
  Outro: 'free', // outro → texto livre (especificar)
}
// Ícones (glifos unicode, como no mock) — o modal de pagamento usa ícones, não iniciais.
const PAYMENT_ICON: Record<PaymentMethod, string> = {
  PIX: '⚡',
  Boleto: '⠇',
  TED: '→',
  TransferenciaBancaria: '⇄',
  CartaoCorporativo: '▢',
  Cambio: '$',
  GuiaRecolhimento: '▤',
  Outro: '·',
}

export type PaymentMethodMeta = Readonly<{
  method: PaymentMethod
  icon: string
  complementary: PaymentComplementary
}>

export const PAYMENT_METHOD_META: readonly PaymentMethodMeta[] = PAYMENT_METHODS.map((method) => ({
  method,
  icon: PAYMENT_ICON[method],
  complementary: PAYMENT_COMPLEMENTARY[method],
}))

/** Nome (i18n) e descrição (i18n) do método — usados no card do modal. */
export const paymentMethodNameTag = (m: PaymentMethod): string => `financial.paymentMethod.${m}`
export const paymentMethodDescTag = (m: PaymentMethod): string => `financial.create.payMethod.desc.${m}`

/** Campo complementar controlado pela forma escolhida ('none' quando vazio). */
export const paymentComplementaryOf = (m: PaymentMethod | ''): PaymentComplementary =>
  m === '' ? 'none' : PAYMENT_COMPLEMENTARY[m]

export const isDocumentType = (v: string): v is DocumentType =>
  (DOCUMENT_TYPES as readonly string[]).includes(v)
export const isPaymentMethod = (v: string): v is PaymentMethod =>
  (PAYMENT_METHODS as readonly string[]).includes(v)

/** Máscara monetária as-you-type p/ os campos de valor (bruto/retenções/reforma) — "R$ 1.500,50". */
export const maskMoney = (raw: string): string => maskMoneyBRL(raw)

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
