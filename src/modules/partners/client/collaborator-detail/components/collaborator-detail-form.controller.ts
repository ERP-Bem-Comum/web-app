/**
 * Controller (ADR-0009) do form de detalhe/edição do colaborador. Mantém o estado dos campos do
 * pré-cadastro (7) + cadastro completo (2ª etapa), inicializado a partir do detalhe carregado.
 * `buildPre()`/`buildComplete()` montam os inputs dos dois server-fns (update + complete-registration).
 * Banco/PIX são editáveis (spec 120): `validate()` barra grupo parcial antes do salvar.
 */
import { useCallback, useState } from 'react'

import { toBankCode } from '#shared/banking/febraban-banks.ts'

import {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  GENDER_IDENTITIES,
  RACES,
  EDUCATION_LEVELS,
  FOOD_CATEGORIES,
  SEXES,
  MARITAL_STATUSES,
  PIX_KEY_TYPES,
  isPixKeyType,
  BankAccountFormSchema,
  PixKeyFormSchema,
  type BankAccount,
  type PixKey,
  type CollaboratorDetail,
  type CollaboratorWriteInput,
  type CollaboratorCompleteInput,
  type OccupationArea,
  type EmploymentRelationship,
  type PixKeyType,
} from '#modules/partners/client/data/model/collaborator.model.ts'

// Núcleo PURO dos campos da 2ª etapa — extraído p/ reuso pelo Autocadastro (#040) sem mudar comportamento.
import {
  parseChildrenAges,
  formatChildrenAges,
  boolToTri,
  buildCompleteFields,
  computeHasCompleteData as computeHasCompleteFields,
  type CollaboratorCompleteFieldsState,
} from './collaborator-complete-fields.ts'

// Re-export p/ a view burra (component) consumir os enums sem importar `data/` direto (boundary §XI).
export {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  GENDER_IDENTITIES,
  RACES,
  EDUCATION_LEVELS,
  FOOD_CATEGORIES,
  SEXES,
  MARITAL_STATUSES,
  PIX_KEY_TYPES,
  isPixKeyType,
}

// Re-export dos helpers puros de "Idade dos filhos" (agora em `children-ages.ts`) — API estável p/ quem
// já importava daqui (detail component + testes). Comportamento idêntico.
export { parseChildrenAges, formatChildrenAges }

// O estado do form do detalhe = os campos da 2ª etapa (núcleo puro reusável) + pré-cadastro + território
// (read-only) + banco/PIX (editáveis, spec 120). `CollaboratorCompleteFieldsState` vem do módulo puro.
export type CollaboratorDetailFormState = CollaboratorCompleteFieldsState &
  Readonly<{
    // pré-cadastro
    name: string
    email: string
    cpf: string
    occupationArea: string
    role: string
    startOfContract: string
    employmentRelationship: string
    // Território (#42) — somente leitura no detalhe (o PUT omite território).
    uf: string
    municipality: string
    // Banco/PIX (#40) — editáveis no modo Editar (spec 120). `bank` = código COMPE (ou texto legado).
    bank: string
    agency: string
    accountNumber: string
    checkDigit: string
    pixKeyType: PixKeyType
    pixKey: string
  }>

/**
 * Banco legado em texto livre: '237', '0237' ou '237 - Bradesco' viram '237' (mesmo critério do
 * Fornecedor). O que não dá para reconhecer sem ambiguidade fica como está e o seletor mostra
 * "não reconhecido". Nunca adivinha pelo nome.
 */
const normalizeBankCode = (raw: string): string => toBankCode(raw) ?? raw

const fromDetail = (c: CollaboratorDetail): CollaboratorDetailFormState => ({
  name: c.name,
  email: c.email,
  cpf: c.cpf,
  occupationArea: c.occupationArea,
  role: c.role,
  // Datas chegam do backend como ISO datetime (…T00:00:00.000Z); o form/`z.iso.date()` exige YYYY-MM-DD.
  startOfContract: c.startOfContract.slice(0, 10),
  employmentRelationship: c.employmentRelationship,
  rg: c.rg ?? '',
  dateOfBirth: (c.dateOfBirth ?? '').slice(0, 10),
  completeAddress: c.completeAddress ?? '',
  telephone: c.telephone ?? '',
  emergencyContactName: c.emergencyContactName ?? '',
  emergencyContactTelephone: c.emergencyContactTelephone ?? '',
  genderIdentity: c.genderIdentity ?? '',
  race: c.race ?? '',
  allergies: c.allergies ?? '',
  foodCategory: c.foodCategory ?? '',
  foodCategoryDescription: c.foodCategoryDescription ?? '',
  education: c.education ?? '',
  biography: c.biography ?? '',
  experienceInThePublicSector: boolToTri(c.experienceInThePublicSector),
  // Perfil completo (US2).
  sex: c.sex ?? '',
  maritalStatus: c.maritalStatus ?? '',
  publicSectorExperienceDuration: c.publicSectorExperienceDuration ?? '',
  hasChildren: boolToTri(c.hasChildren),
  childrenCount: c.childrenCount === undefined ? '' : String(c.childrenCount),
  childrenAges: formatChildrenAges(c.childrenAges),
  isPwd: boolToTri(c.isPwd),
  pwdDescription: c.pwdDescription ?? '',
  isOnLeave: boolToTri(c.isOnLeave),
  leaveDuration: c.leaveDuration ?? '',
  leaveRenewable: boolToTri(c.leaveRenewable),
  leaveRenewalDuration: c.leaveRenewalDuration ?? '',
  uf: c.territory?.uf ?? '',
  municipality: c.territory?.municipality ?? '',
  bank: normalizeBankCode(c.bankAccount?.bank ?? ''),
  agency: c.bankAccount?.agency ?? '',
  accountNumber: c.bankAccount?.accountNumber ?? '',
  checkDigit: c.bankAccount?.checkDigit ?? '',
  pixKeyType: c.pixKey?.keyType ?? 'cpf',
  pixKey: c.pixKey?.key ?? '',
})

/**
 * Monta o input do PATCH complete-registration a partir do estado do form (PURO — testável sem React).
 * Delega a montagem dos campos ao núcleo puro (`buildCompleteFields`) e anexa o `id` do colaborador.
 * Campos vazios → `undefined`; booleans via tri-state; idades via parser (comportamento inalterado).
 */
export const buildCompleteInput = (
  state: CollaboratorDetailFormState,
  id: string,
): CollaboratorCompleteInput => ({ id, ...buildCompleteFields(state) })

/** Há algum dado de perfil (2ª etapa) preenchido? (PURO — testável sem React). Delega ao núcleo puro. */
export const computeHasCompleteData = (f: CollaboratorDetailFormState): boolean => computeHasCompleteFields(f)

/** Hidratação PURA do estado do form a partir do detalhe carregado (testável sem React). */
export const stateFromDetail = (detail: CollaboratorDetail): CollaboratorDetailFormState => fromDetail(detail)

/** Erros do grupo bancário/PIX, por caminho (`bankAccount.agency`, `pixKey.key`…). */
export type CollaboratorDetailFormErrors = Readonly<Record<string, boolean>>

const filled = (v: string): boolean => v.trim() !== ''
const hasBankData = (s: CollaboratorDetailFormState): boolean =>
  [s.bank, s.agency, s.accountNumber, s.checkDigit].some(filled)
const hasPixData = (s: CollaboratorDetailFormState): boolean => filled(s.pixKey)

// Agência: 4 dígitos + DV opcional, o mesmo critério do core-api (`^\d{4}(-?\d)?$`). O estado guarda só
// dígitos (máscara), mas um valor legado pode chegar com hífen ("1234-5"): o hífen só vale na 5ª posição.
const isValidAgency = (v: string): boolean => {
  const digits = v.replace('-', '')
  if (!/^\d{4,5}$/.test(digits)) return false
  return v === digits || (v.indexOf('-') === 4 && digits.length === 5)
}

/**
 * Banco/PIX do PUT (PURO). Grupo preenchido → objeto (substitui); grupo vazio → `null`, que no core-api
 * MANTÉM o que está gravado (core-api#1029). Remover pelo PUT não existe.
 */
export const buildPaymentTarget = (
  s: CollaboratorDetailFormState,
): Readonly<{ bankAccount: BankAccount | null; pixKey: PixKey | null }> => ({
  bankAccount: hasBankData(s)
    ? {
        bank: s.bank.trim(),
        agency: s.agency.trim(),
        accountNumber: s.accountNumber.trim(),
        checkDigit: s.checkDigit.trim(),
      }
    : null,
  pixKey: hasPixData(s) ? { keyType: s.pixKeyType, key: s.pixKey.trim() } : null,
})

/**
 * Validação PURA do grupo bancário/PIX antes do salvar (spec 120):
 *  - "tudo ou nada": banco parcial marca os campos que faltam;
 *  - agência fora do formato do core-api;
 *  - esvaziar um grupo que JÁ tinha dado: o `null` manteria o gravado e a tela mentiria que apagou,
 *    então marca o grupo (remover não está no escopo).
 */
export const validatePaymentTarget = (
  s: CollaboratorDetailFormState,
  original: CollaboratorDetail,
): CollaboratorDetailFormErrors => {
  const errors: Record<string, boolean> = {}
  const { bankAccount, pixKey } = buildPaymentTarget(s)

  if (bankAccount !== null) {
    const parsed = BankAccountFormSchema.safeParse(bankAccount)
    if (!parsed.success) for (const i of parsed.error.issues) errors[`bankAccount.${i.path.join('.')}`] = true
    if (filled(bankAccount.agency) && !isValidAgency(bankAccount.agency)) errors['bankAccount.agency'] = true
  } else if (original.bankAccount !== null) {
    errors['bankAccount.removal'] = true
    errors['bankAccount.bank'] = true
    errors['bankAccount.agency'] = true
    errors['bankAccount.accountNumber'] = true
  }

  if (pixKey !== null) {
    const parsed = PixKeyFormSchema.safeParse(pixKey)
    if (!parsed.success) for (const i of parsed.error.issues) errors[`pixKey.${i.path.join('.')}`] = true
  } else if (original.pixKey !== null) {
    errors['pixKey.removal'] = true
    errors['pixKey.key'] = true
  }

  return errors
}

export interface CollaboratorDetailFormController {
  readonly state: CollaboratorDetailFormState
  readonly errors: CollaboratorDetailFormErrors
  readonly setField: <K extends keyof CollaboratorDetailFormState>(
    key: K,
    value: CollaboratorDetailFormState[K],
  ) => void
  readonly reset: (detail: CollaboratorDetail) => void
  /** Valida banco/PIX contra o detalhe ATUAL (o gravado); marca os erros e diz se pode salvar. */
  readonly validate: (current: CollaboratorDetail) => boolean
  readonly buildPre: () => CollaboratorWriteInput
  readonly buildComplete: (id: string) => CollaboratorCompleteInput
  readonly hasCompleteData: () => boolean
}

export function useCollaboratorDetailFormController(
  initial: CollaboratorDetail,
): CollaboratorDetailFormController {
  const [state, setState] = useState<CollaboratorDetailFormState>(() => fromDetail(initial))
  const [errors, setErrors] = useState<CollaboratorDetailFormErrors>({})

  const setField = useCallback<CollaboratorDetailFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const reset = useCallback((detail: CollaboratorDetail) => {
    setState(fromDetail(detail))
    setErrors({})
  }, [])

  const validate = useCallback(
    (current: CollaboratorDetail): boolean => {
      const next = validatePaymentTarget(state, current)
      setErrors(next)
      return Object.keys(next).length === 0
    },
    [state],
  )

  const buildPre = useCallback(
    (): CollaboratorWriteInput => ({
      name: state.name.trim(),
      email: state.email.trim(),
      cpf: state.cpf.trim(),
      // valores vêm do <select> dos enums — cast seguro (são membros do enum). Validação real no server.
      occupationArea: state.occupationArea as OccupationArea,
      role: state.role.trim(),
      startOfContract: state.startOfContract,
      employmentRelationship: state.employmentRelationship as EmploymentRelationship,
      // PUT omite território (#42); a borda de update faz strip. Banco/PIX: objeto substitui, `null`
      // mantém o gravado (spec 120, core-api#1029).
      territory: null,
      ...buildPaymentTarget(state),
    }),
    [state],
  )

  const buildComplete = useCallback(
    (id: string): CollaboratorCompleteInput => buildCompleteInput(state, id),
    [state],
  )

  const hasCompleteData = useCallback((): boolean => computeHasCompleteData(state), [state])

  return { state, errors, setField, reset, validate, buildPre, buildComplete, hasCompleteData }
}
