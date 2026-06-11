/**
 * Model do client (client-data) — tipos de I/O do repository de Users, espelhando `user.io.ts`. Tipos
 * locais (não importa server/domain nem public-api — boundary §I).
 */
import * as z from 'zod'

export type UserActivation = 'active' | 'inactive'
export type UserStatusFilter = 'active' | 'inactive' | 'all'

export type UserListItem = Readonly<{
  id: string
  name: string
  email: string
  activation: UserActivation
}>

export type UserListResponse = Readonly<{
  items: readonly UserListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>

// ── Input enviado pelo repository (a server fn valida no server) ──
export type UserListInput = Readonly<{
  search?: string
  status: UserStatusFilter
  page: number
  pageSize: 5 | 10 | 25
}>

// Criação (POST /users). Espelha o `CreateUserInput` do server (apenas os campos do body).
export type CreateUserInput = Readonly<{
  name: string
  cpf: string
  email: string
  telephone: string
}>

export type CreatedUser = Readonly<{ id: string }>

// Detalhe (GET /users/:id) — name/cpf/telephone já normalizados ('' quando null no backend).
export type UserDetail = Readonly<{
  id: string
  name: string
  email: string
  cpf: string
  telephone: string
  imageUrl: string | null
  active: boolean
  massApprovalPermission: boolean
}>

// Edição (PUT /users/:id) — envia os 4 campos do form.
export type UpdateUserInput = Readonly<{
  name: string
  cpf: string
  email: string
  telephone: string
}>

// Minha Conta — PUT /me aceita só name + telephone.
export type UpdateMeInput = Readonly<{
  name: string
  telephone: string
}>

// Troca de senha autenticada.
export type ChangePasswordInput = Readonly<{
  currentPassword: string
  newPassword: string
}>

const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')

/** CPF: aceita com/sem máscara; normaliza para 11 dígitos (o server fn aceita 11–14). */
export const CpfFieldSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((d) => d.length === 11, { error: 'cpf-invalid' })

/** Telefone: aceita com/sem máscara; normaliza para 10–11 dígitos (fixo/celular). */
export const TelephoneFieldSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((d) => d.length >= 10 && d.length <= 11, { error: 'telephone-invalid' })

/** Formulário de inclusão de Usuário — campos que vão ao POST /users. */
export const UserFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  cpf: CpfFieldSchema,
  email: z.email(),
  telephone: TelephoneFieldSchema,
})
export type UserFormValues = z.infer<typeof UserFormSchema>
