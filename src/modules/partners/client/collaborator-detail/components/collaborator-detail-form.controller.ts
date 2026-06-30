/**
 * Controller (ADR-0009) do form de detalhe/edição do colaborador. Mantém o estado dos campos do
 * pré-cadastro (7) + cadastro completo (2ª etapa), inicializado a partir do detalhe carregado.
 * `buildPre()`/`buildComplete()` montam os inputs dos dois server-fns (update + complete-registration).
 */
import { useCallback, useState } from 'react'

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
  type CollaboratorDetail,
  type CollaboratorWriteInput,
  type CollaboratorCompleteInput,
  type OccupationArea,
  type EmploymentRelationship,
  type PixKeyType,
} from '#modules/partners/client/data/model/collaborator.model.ts'

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

// ── Helpers puros p/ "Idade dos filhos" (texto livre ↔ int[]) — testáveis isoladamente ──
/** Extrai todos os inteiros não-negativos do texto, na ordem (ex.: "5 anos, 12 anos" → [5, 12]). */
export const parseChildrenAges = (raw: string): number[] =>
  (raw.match(/\d+/g) ?? []).map((d) => Number.parseInt(d, 10)).filter((n) => Number.isInteger(n) && n >= 0)

/** Formata int[] como texto legível p/ hidratação (ex.: [5, 12] → "5, 12"). */
export const formatChildrenAges = (ages: readonly number[] | undefined): string =>
  ages === undefined ? '' : ages.join(', ')

export type CollaboratorDetailFormState = Readonly<{
  // pré-cadastro
  name: string
  email: string
  cpf: string
  occupationArea: string
  role: string
  startOfContract: string
  employmentRelationship: string
  // cadastro completo (2ª etapa)
  rg: string
  dateOfBirth: string
  completeAddress: string
  telephone: string
  emergencyContactName: string
  emergencyContactTelephone: string
  genderIdentity: string
  race: string
  allergies: string
  foodCategory: string
  foodCategoryDescription: string
  education: string
  biography: string
  experienceInThePublicSector: '' | 'sim' | 'nao'
  // Perfil completo (US2). Booleans como select sim/não (espelham experienceInThePublicSector).
  sex: string
  maritalStatus: string
  publicSectorExperienceDuration: string
  hasChildren: '' | 'sim' | 'nao'
  childrenCount: string
  childrenAges: string // texto livre ("5 anos, 12 anos") ↔ int[] via parse/format
  isPwd: '' | 'sim' | 'nao'
  pwdDescription: string
  isOnLeave: '' | 'sim' | 'nao'
  leaveDuration: string
  leaveRenewable: '' | 'sim' | 'nao'
  leaveRenewalDuration: string
  // Território (#42) — somente leitura no detalhe (o PUT omite território).
  uf: string
  municipality: string
  // Banco/PIX (#40) — create-only; somente leitura no detalhe (o PUT omite).
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
  pixKeyType: PixKeyType
  pixKey: string
}>

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
  bank: c.bankAccount?.bank ?? '',
  agency: c.bankAccount?.agency ?? '',
  accountNumber: c.bankAccount?.accountNumber ?? '',
  checkDigit: c.bankAccount?.checkDigit ?? '',
  pixKeyType: c.pixKey?.keyType ?? 'cpf',
  pixKey: c.pixKey?.key ?? '',
})

const blank = (s: string): string | undefined => (s.trim() === '' ? undefined : s.trim())

// Tri-state do select sim/não ↔ boolean opcional (mesma semântica de experienceInThePublicSector).
const boolToTri = (v: boolean | undefined): '' | 'sim' | 'nao' => (v === undefined ? '' : v ? 'sim' : 'nao')
const triToBool = (v: '' | 'sim' | 'nao'): boolean | undefined => (v === '' ? undefined : v === 'sim')

// childrenCount: texto → int (vazio/NaN → undefined). Reusa o parser de dígitos.
const blankInt = (s: string): number | undefined => {
  const t = s.trim()
  if (t === '') return undefined
  const n = Number.parseInt(t, 10)
  return Number.isInteger(n) && n >= 0 ? n : undefined
}

/**
 * Monta o input do PATCH complete-registration a partir do estado do form (PURO — testável sem React).
 * Campos vazios → `undefined` (semântica "não informado"); booleans via tri-state; idades via parser.
 */
export const buildCompleteInput = (
  state: CollaboratorDetailFormState,
  id: string,
): CollaboratorCompleteInput => {
  const ages = parseChildrenAges(state.childrenAges)
  return {
    id,
    rg: blank(state.rg),
    dateOfBirth: blank(state.dateOfBirth),
    genderIdentity: blank(state.genderIdentity),
    race: blank(state.race),
    education: blank(state.education),
    foodCategory: blank(state.foodCategory),
    foodCategoryDescription: blank(state.foodCategoryDescription),
    completeAddress: blank(state.completeAddress),
    telephone: blank(state.telephone),
    emergencyContactName: blank(state.emergencyContactName),
    emergencyContactTelephone: blank(state.emergencyContactTelephone),
    allergies: blank(state.allergies),
    biography: blank(state.biography),
    experienceInThePublicSector: triToBool(state.experienceInThePublicSector),
    // Perfil completo (US2).
    sex: blank(state.sex),
    maritalStatus: blank(state.maritalStatus),
    publicSectorExperienceDuration: blank(state.publicSectorExperienceDuration),
    hasChildren: triToBool(state.hasChildren),
    childrenCount: blankInt(state.childrenCount),
    childrenAges: ages.length === 0 ? undefined : ages,
    isPwd: triToBool(state.isPwd),
    pwdDescription: blank(state.pwdDescription),
    isOnLeave: triToBool(state.isOnLeave),
    leaveDuration: blank(state.leaveDuration),
    leaveRenewable: triToBool(state.leaveRenewable),
    leaveRenewalDuration: blank(state.leaveRenewalDuration),
  }
}

/** Há algum dado de perfil (2ª etapa) preenchido? (PURO — testável sem React). */
export const computeHasCompleteData = (f: CollaboratorDetailFormState): boolean => {
  const texts = [
    f.rg,
    f.dateOfBirth,
    f.completeAddress,
    f.telephone,
    f.emergencyContactName,
    f.emergencyContactTelephone,
    f.genderIdentity,
    f.race,
    f.allergies,
    f.foodCategory,
    f.foodCategoryDescription,
    f.education,
    f.biography,
    // Perfil completo (US2).
    f.sex,
    f.maritalStatus,
    f.publicSectorExperienceDuration,
    f.childrenCount,
    f.childrenAges,
    f.pwdDescription,
    f.leaveDuration,
    f.leaveRenewalDuration,
  ]
  const tris = [f.experienceInThePublicSector, f.hasChildren, f.isPwd, f.isOnLeave, f.leaveRenewable]
  return texts.some((v) => v.trim() !== '') || tris.some((v) => v !== '')
}

/** Hidratação PURA do estado do form a partir do detalhe carregado (testável sem React). */
export const stateFromDetail = (detail: CollaboratorDetail): CollaboratorDetailFormState => fromDetail(detail)

export interface CollaboratorDetailFormController {
  readonly state: CollaboratorDetailFormState
  readonly setField: <K extends keyof CollaboratorDetailFormState>(
    key: K,
    value: CollaboratorDetailFormState[K],
  ) => void
  readonly reset: (detail: CollaboratorDetail) => void
  readonly buildPre: () => CollaboratorWriteInput
  readonly buildComplete: (id: string) => CollaboratorCompleteInput
  readonly hasCompleteData: () => boolean
}

export function useCollaboratorDetailFormController(
  initial: CollaboratorDetail,
): CollaboratorDetailFormController {
  const [state, setState] = useState<CollaboratorDetailFormState>(() => fromDetail(initial))

  const setField = useCallback<CollaboratorDetailFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const reset = useCallback((detail: CollaboratorDetail) => {
    setState(fromDetail(detail))
  }, [])

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
      // PUT omite território (#42) e banco/PIX (#40); a borda de update faz strip. Enviamos null.
      territory: null,
      bankAccount: null,
      pixKey: null,
    }),
    [state],
  )

  const buildComplete = useCallback(
    (id: string): CollaboratorCompleteInput => buildCompleteInput(state, id),
    [state],
  )

  const hasCompleteData = useCallback((): boolean => computeHasCompleteData(state), [state])

  return { state, setField, reset, buildPre, buildComplete, hasCompleteData }
}
