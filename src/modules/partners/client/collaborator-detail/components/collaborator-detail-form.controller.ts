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
// + banco/PIX (estes últimos read-only no detalhe). `CollaboratorCompleteFieldsState` vem do módulo puro.
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
