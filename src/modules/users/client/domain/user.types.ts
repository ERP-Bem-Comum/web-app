/**
 * Tipos de domínio do client (o que a view/page consome). `UserRow` = linha do grid.
 */
export type UserActivation = 'active' | 'inactive'

export type UserRow = Readonly<{
  id: string
  name: string
  email: string
  activation: UserActivation
}>

/** Ação de ativação disponível conforme o status atual: ativo → desativar; inativo → reativar. */
export type StatusAction = 'deactivate' | 'reactivate'
