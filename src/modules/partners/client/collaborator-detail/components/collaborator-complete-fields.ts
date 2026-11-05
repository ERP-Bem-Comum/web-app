/**
 * Núcleo PURO (agnóstico de React) dos campos do cadastro completo do colaborador (2ª etapa).
 * Extraído de `collaborator-detail-form.controller.ts` (#040) para poder ser reusado pelo form do
 * Autocadastro (rota pública) SEM arrastar React nem tocar o comportamento do detalhe. O controller do
 * detalhe re-exporta estes símbolos; o comportamento é idêntico (só mudou o local da definição).
 */
import {
  PWD_TYPES,
  type CollaboratorCompleteInput,
  type Pwd,
  type PwdAnswer,
  type PwdInput,
  type PwdType,
} from '#modules/partners/client/data/model/collaborator.model.ts'

import { parseChildrenAges, formatChildrenAges } from './children-ages.ts'

export { parseChildrenAges, formatChildrenAges }

/** Estado (form) dos campos do cadastro completo — a 2ª etapa (dados pessoais). */
export type CollaboratorCompleteFieldsState = Readonly<{
  rg: string
  dateOfBirth: string
  completeAddress: string
  telephone: string
  emergencyContactName: string
  emergencyContactTelephone: string
  genderIdentity: string
  genderIdentityDescription: string
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
  // Pessoa com Deficiência (spec 131): pergunta 1, tipos marcados (pergunta 2) e o texto de "Outra".
  pwdAnswer: '' | PwdAnswer
  pwdTypes: readonly PwdType[]
  pwdOtherDescription: string
  isOnLeave: '' | 'sim' | 'nao'
  leaveDuration: string
  leaveRenewable: '' | 'sim' | 'nao'
  leaveRenewalDuration: string
}>

/** Estado inicial vazio dos campos da 2ª etapa (usado quando não há detalhe pré-carregado). */
export const emptyCompleteFieldsState: CollaboratorCompleteFieldsState = {
  rg: '',
  dateOfBirth: '',
  completeAddress: '',
  telephone: '',
  emergencyContactName: '',
  emergencyContactTelephone: '',
  genderIdentity: '',
  genderIdentityDescription: '',
  race: '',
  allergies: '',
  foodCategory: '',
  foodCategoryDescription: '',
  education: '',
  biography: '',
  experienceInThePublicSector: '',
  sex: '',
  maritalStatus: '',
  publicSectorExperienceDuration: '',
  hasChildren: '',
  childrenCount: '',
  childrenAges: '',
  pwdAnswer: '',
  pwdTypes: [],
  pwdOtherDescription: '',
  isOnLeave: '',
  leaveDuration: '',
  leaveRenewable: '',
  leaveRenewalDuration: '',
}

/** Código de "Outra identidade de gênero" — o único que aceita o texto livre (core-api#1054). */
export const GENDER_IDENTITY_OTHER = 'OUTRO'

// ── Pessoa com Deficiência (spec 131) ─────────────────────────────────────────────

/** Tipo "Outra" — o único que abre o texto livre (molde de Identidade de Gênero). */
export const PWD_TYPE_OTHER: PwdType = 'OUTRA'

/** Estado do form a partir do GRAVADO. Não respondeu → tudo vazio. */
export const pwdStateFrom = (
  pwd: Pwd | undefined,
): Pick<CollaboratorCompleteFieldsState, 'pwdAnswer' | 'pwdTypes' | 'pwdOtherDescription'> => ({
  pwdAnswer: pwd?.answer ?? '',
  pwdTypes: pwd?.types ?? [],
  pwdOtherDescription: pwd?.otherDescription ?? '',
})

/**
 * Completo = respondido de vez (P.O., 23/10): "Não", "Prefiro não responder", ou "Sim" com tipo e — havendo
 * "Outra" — com o texto. É a mesma régua do core-api: vazio ou incompleto fica ABERTO; completo TRAVA.
 */
export const isPwdComplete = (pwd: Pwd | undefined): boolean => {
  if (pwd === undefined) return false
  if (pwd.answer !== 'SIM') return true
  if (pwd.types.length === 0) return false
  return !pwd.types.includes(PWD_TYPE_OTHER) || (pwd.otherDescription ?? '').trim() !== ''
}

/** O que falta na resposta do form — a tela marca o campo em vez de levar o 422 do core-api. */
export type PwdIssue = 'answer-required' | 'type-required' | 'other-required'

export const pwdIssues = (
  s: Pick<CollaboratorCompleteFieldsState, 'pwdAnswer' | 'pwdTypes' | 'pwdOtherDescription'>,
  opts: Readonly<{ required: boolean }>,
): readonly PwdIssue[] => {
  if (s.pwdAnswer === '') return opts.required ? ['answer-required'] : []
  if (s.pwdAnswer !== 'SIM') return []
  if (s.pwdTypes.length === 0) return ['type-required']
  return s.pwdTypes.includes(PWD_TYPE_OTHER) && s.pwdOtherDescription.trim() === '' ? ['other-required'] : []
}

/**
 * Resposta para o core-api. Sem resposta → `undefined` (mantém o gravado). Tipos na ordem do formulário; o
 * texto só vai com "Outra" — desmarcar "Outra" descarta o digitado em vez de mandá-lo e levar o 422.
 */
export const buildPwdInput = (
  s: Pick<CollaboratorCompleteFieldsState, 'pwdAnswer' | 'pwdTypes' | 'pwdOtherDescription'>,
): PwdInput | undefined => {
  if (s.pwdAnswer === '') return undefined
  if (s.pwdAnswer !== 'SIM') return { answer: s.pwdAnswer }
  const types = PWD_TYPES.filter((t) => s.pwdTypes.includes(t))
  const otherDescription = types.includes(PWD_TYPE_OTHER) ? blank(s.pwdOtherDescription) : undefined
  return { answer: 'SIM', types, ...(otherDescription !== undefined ? { otherDescription } : {}) }
}

/** Marca/desmarca um tipo, preservando a ordem do formulário. */
export const togglePwdType = (
  types: readonly PwdType[],
  type: PwdType,
  checked: boolean,
): readonly PwdType[] => PWD_TYPES.filter((t) => (t === type ? checked : types.includes(t)))

export const blank = (s: string): string | undefined => (s.trim() === '' ? undefined : s.trim())

// Tri-state do select sim/não ↔ boolean opcional (mesma semântica de experienceInThePublicSector).
export const boolToTri = (v: boolean | undefined): '' | 'sim' | 'nao' =>
  v === undefined ? '' : v ? 'sim' : 'nao'
export const triToBool = (v: '' | 'sim' | 'nao'): boolean | undefined => (v === '' ? undefined : v === 'sim')

// childrenCount: texto → int (vazio/NaN → undefined). Reusa o parser de dígitos.
export const blankInt = (s: string): number | undefined => {
  const t = s.trim()
  if (t === '') return undefined
  const n = Number.parseInt(t, 10)
  return Number.isInteger(n) && n >= 0 ? n : undefined
}

/**
 * Monta os campos do complete-registration a partir do estado (PURO — testável sem React). Campos vazios
 * → `undefined` ("não informado"); booleans via tri-state; idades via parser. NÃO inclui `id` (o caller
 * — detail ou autocadastro — anexa a chave de identidade que possui).
 */
export const buildCompleteFields = (
  state: CollaboratorCompleteFieldsState,
): Omit<CollaboratorCompleteInput, 'id'> => {
  const ages = parseChildrenAges(state.childrenAges)
  return {
    rg: blank(state.rg),
    dateOfBirth: blank(state.dateOfBirth),
    genderIdentity: blank(state.genderIdentity),
    // Só vai com "Outra": o core-api recusa (422) a descrição com outra identidade (#1054, P.O. 16/10).
    // Trocar de "Outra" para outra opção descarta o texto digitado em vez de mandá-lo e levar o 422.
    genderIdentityDescription:
      state.genderIdentity === GENDER_IDENTITY_OTHER ? blank(state.genderIdentityDescription) : undefined,
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
    pwd: buildPwdInput(state),
    isOnLeave: triToBool(state.isOnLeave),
    leaveDuration: blank(state.leaveDuration),
    leaveRenewable: triToBool(state.leaveRenewable),
    leaveRenewalDuration: blank(state.leaveRenewalDuration),
  }
}

/** Há algum dado de perfil (2ª etapa) preenchido? (PURO — testável sem React). */
export const computeHasCompleteData = (f: CollaboratorCompleteFieldsState): boolean => {
  const texts = [
    f.rg,
    f.dateOfBirth,
    f.completeAddress,
    f.telephone,
    f.emergencyContactName,
    f.emergencyContactTelephone,
    f.genderIdentity,
    f.genderIdentityDescription,
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
    f.pwdAnswer,
    f.pwdOtherDescription,
    f.leaveDuration,
    f.leaveRenewalDuration,
  ]
  const tris = [f.experienceInThePublicSector, f.hasChildren, f.isOnLeave, f.leaveRenewable]
  return texts.some((v) => v.trim() !== '') || tris.some((v) => v !== '') || f.pwdTypes.length > 0
}
