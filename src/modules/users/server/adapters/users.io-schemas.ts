/**
 * Schemas Zod de I/O de Users — vivem na BORDA (adapters), não no domínio (C2). Os tipos
 * correspondentes são escritos à mão em `../domain/user.io.ts`; guards travam o drift.
 * Alinhado ao `GET /api/v1/users` (pageSize ∈ {5,10,25}, status active|inactive|all).
 */
import * as z from 'zod'

import type * as D from '../domain/user.io.ts'

export const ListUsersInputSchema = z.object({
  search: z.string().trim().max(128).optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  page: z.int().min(1).default(1),
  pageSize: z
    .union([z.literal(5), z.literal(10), z.literal(25)])
    .default(5),
})

// Criação (POST /api/v1/users). Validação de FORMATO (cpf/email/telefone) é do core-api (VOs → 422);
// aqui garantimos presença e limites de tamanho.
export const CreateUserInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  cpf: z.string().trim().min(1).max(14),
  email: z.string().trim().min(1).max(254),
  telephone: z.string().trim().min(1).max(20),
})

// Edição (PUT /api/v1/users/:id) — mesma forma do create (envia os 4 campos).
export const UpdateUserInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  cpf: z.string().trim().min(1).max(14),
  email: z.string().trim().min(1).max(254),
  telephone: z.string().trim().min(1).max(20),
})

// Minha Conta — PUT /me (só name + telephone).
export const UpdateMeInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  telephone: z.string().trim().min(1).max(20),
})

// Troca de senha — currentPassword + newPassword. Min 12 alinhado ao backend (#32, OWASP 2025);
// a policy fina (blocklist de comuns) vive no core-api. Defesa de borda além da validação de UI.
export const ChangePasswordInputSchema = z.object({
  currentPassword: z.string().trim().min(1),
  newPassword: z.string().trim().min(12).max(128),
})

type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const _g_list: AssertEqual<z.infer<typeof ListUsersInputSchema>, D.ListUsersInput> = true
const _g_create: AssertEqual<z.infer<typeof CreateUserInputSchema>, D.CreateUserInput> = true
const _g_update: AssertEqual<z.infer<typeof UpdateUserInputSchema>, D.UpdateUserInput> = true
const _g_me: AssertEqual<z.infer<typeof UpdateMeInputSchema>, D.UpdateMeInput> = true
const _g_pw: AssertEqual<z.infer<typeof ChangePasswordInputSchema>, D.ChangePasswordInput> = true
void [_g_list, _g_create, _g_update, _g_me, _g_pw]
