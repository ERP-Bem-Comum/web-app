/**
 * Users — tipos de I/O do domínio (PUROS, sem Zod — C2). Os schemas Zod vivem na borda
 * (`../adapters/users.io-schemas.ts`). Nomes/valores alinhados ao contrato REAL do core-api
 * (`/api/v1/users`): listagem paginada administrativa.
 */

export type UserStatusFilter = 'active' | 'inactive' | 'all'
export type UserActivation = 'active' | 'inactive'

// ── Input (validado na server fn pelos schemas em adapters) ─────────────────────
export interface ListUsersInput {
  search?: string
  status: UserStatusFilter
  page: number
  pageSize: 5 | 10 | 25
}

// Criação administrativa (POST /api/v1/users) — body { name, cpf, email, telephone }.
// Foto (PUT /users/:id/photo) e "Aprovador em Massa" (derivado de papéis, read-only) NÃO entram aqui.
export interface CreateUserInput {
  name: string
  cpf: string
  email: string
  telephone: string
}

export type CreatedUser = Readonly<{ id: string }>

// Edição (PUT /api/v1/users/:id) — envia os 4 campos do form (o backend aceita patch parcial).
export interface UpdateUserInput {
  name: string
  cpf: string
  email: string
  telephone: string
}

// Minha Conta (autosserviço). PUT /api/v1/me aceita name + email + telephone (CPF imutável). E-mail
// editável desde o core-api USR-ME-PROFILE-FIELDS (PR #32): duplicado → 409 email-already-registered.
export interface UpdateMeInput {
  name: string
  email: string
  telephone: string
}

// Troca de senha autenticada — POST /api/v2/auth/change-password (revoga as sessões → logout).
export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

// ── Model (o que a UI consome) ─────────────────────────────────────────────────
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

// Detalhe (GET /api/v1/users/:id). name/cpf/telephone podem vir null no backend → normalizados p/ ''.
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
