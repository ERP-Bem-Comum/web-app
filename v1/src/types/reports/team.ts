export interface TeamData {
  id: number
  name: string
  dateOfBirth: number
  occupationArea: string
  role: string
  employmentRelationship: string
  genderIdentity: string | null
  race: string | null
  education: string | null
}

export enum GenderIdentity {
  PREFIRO_NAO_RESPONDER = 'PREFIRO_NAO_RESPONDER',
  HOMEM_CIS = 'HOMEM_CIS',
  HOMEM_TRANS = 'HOMEM_TRANS',
  MULHER_CIS = 'MULHER_CIS',
  MULHER_TRANS = 'MULHER_TRANS',
  TRAVESTI = 'TRAVESTI',
  NAO_BINARIO = 'NAO_BINARIO',
  OUTRO = 'OUTRO',
}

export interface CollaboratorData {
  id: number
  createdAt: string
  updatedAt: string
  name: string
  emergencyContactName: string | null
  email: string
  telephone: string | null
  emergencyContactTelephone: string | null
  cpf: string
  rg: string | null
  occupationArea: string
  genderIdentity: GenderIdentity | null
  race: string | null
  role: string
  startOfContract: string
  dateOfBirth: string | null
  employmentRelationship: 'PJ' | 'CLT' | 'Autônomo' | 'Estagiário' | 'Outros'
  foodCategory: string | null
  education: string | null
  disableBy: string | null
  status: 'CADASTRO_COMPLETO' | 'CADASTRO_INCOMPLETO' | 'OUTROS'
  biography: string | null
  completeAddress: string | null
  allergies: string | null
  experienceInThePublicSector: string | null
  active: boolean
}
