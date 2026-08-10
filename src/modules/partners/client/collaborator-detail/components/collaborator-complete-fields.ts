/**
 * Núcleo PURO (agnóstico de React) dos campos do cadastro completo do colaborador (2ª etapa).
 * Extraído de `collaborator-detail-form.controller.ts` (#040) para poder ser reusado pelo form do
 * Autocadastro (rota pública) SEM arrastar React nem tocar o comportamento do detalhe. O controller do
 * detalhe re-exporta estes símbolos; o comportamento é idêntico (só mudou o local da definição).
 */
import type { CollaboratorCompleteInput } from '#modules/partners/client/data/model/collaborator.model.ts'

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
  isPwd: '',
  pwdDescription: '',
  isOnLeave: '',
  leaveDuration: '',
  leaveRenewable: '',
  leaveRenewalDuration: '',
}

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
export const computeHasCompleteData = (f: CollaboratorCompleteFieldsState): boolean => {
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
