/**
 * Controller (ADR-0009) do form de detalhe/edição do colaborador. Mantém o estado dos campos do
 * pré-cadastro (7) + cadastro completo (2ª etapa), inicializado a partir do detalhe carregado.
 * `buildPre()`/`buildComplete()` montam os inputs dos dois server-fns (update + complete-registration).
 */
import { useCallback, useState } from 'react'

import {
  OCCUPATION_AREAS,
  EMPLOYMENT_RELATIONSHIPS,
  type CollaboratorDetail,
  type CollaboratorWriteInput,
  type CollaboratorCompleteInput,
  type OccupationArea,
  type EmploymentRelationship,
} from '#modules/partners/client/data/model/collaborator.model.ts'

// Re-export p/ a view burra (component) consumir os enums sem importar `data/` direto (boundary §XI).
export { OCCUPATION_AREAS, EMPLOYMENT_RELATIONSHIPS }

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
}>

const fromDetail = (c: CollaboratorDetail): CollaboratorDetailFormState => ({
  name: c.name,
  email: c.email,
  cpf: c.cpf,
  occupationArea: c.occupationArea,
  role: c.role,
  startOfContract: c.startOfContract,
  employmentRelationship: c.employmentRelationship,
  rg: c.rg ?? '',
  dateOfBirth: c.dateOfBirth ?? '',
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
  experienceInThePublicSector: c.experienceInThePublicSector === undefined ? '' : c.experienceInThePublicSector ? 'sim' : 'nao',
})

const blank = (s: string): string | undefined => (s.trim() === '' ? undefined : s.trim())

export interface CollaboratorDetailFormController {
  readonly state: CollaboratorDetailFormState
  readonly setField: <K extends keyof CollaboratorDetailFormState>(key: K, value: CollaboratorDetailFormState[K]) => void
  readonly reset: (detail: CollaboratorDetail) => void
  readonly buildPre: () => CollaboratorWriteInput
  readonly buildComplete: (id: string) => CollaboratorCompleteInput
  readonly hasCompleteData: () => boolean
}

export function useCollaboratorDetailFormController(initial: CollaboratorDetail): CollaboratorDetailFormController {
  const [state, setState] = useState<CollaboratorDetailFormState>(() => fromDetail(initial))

  const setField = useCallback<CollaboratorDetailFormController['setField']>((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const reset = useCallback((detail: CollaboratorDetail) => {
    setState(fromDetail(detail))
  }, [])

  const buildPre = useCallback((): CollaboratorWriteInput => ({
    name: state.name.trim(),
    email: state.email.trim(),
    cpf: state.cpf.trim(),
    // valores vêm do <select> dos enums — cast seguro (são membros do enum). Validação real no server.
    occupationArea: state.occupationArea as OccupationArea,
    role: state.role.trim(),
    startOfContract: state.startOfContract,
    employmentRelationship: state.employmentRelationship as EmploymentRelationship,
  }), [state])

  const buildComplete = useCallback((id: string): CollaboratorCompleteInput => ({
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
    experienceInThePublicSector: state.experienceInThePublicSector === '' ? undefined : state.experienceInThePublicSector === 'sim',
  }), [state])

  const hasCompleteData = useCallback((): boolean => {
    const f = state
    return [
      f.rg, f.dateOfBirth, f.completeAddress, f.telephone, f.emergencyContactName,
      f.emergencyContactTelephone, f.genderIdentity, f.race, f.allergies, f.foodCategory,
      f.foodCategoryDescription, f.education, f.biography,
    ].some((v) => v.trim() !== '') || f.experienceInThePublicSector !== ''
  }, [state])

  return { state, setField, reset, buildPre, buildComplete, hasCompleteData }
}
