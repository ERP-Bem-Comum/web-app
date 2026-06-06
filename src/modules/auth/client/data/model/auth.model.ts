/**
 * client/data Model — padronização client-side do contrato de auth (o que a UI manda/recebe).
 * É só a borda de validação do client (§VI); o domínio "de verdade" é server-side. Zod em client/data (OK).
 */
import * as z from 'zod'

export const LoginInputSchema = z.object({
  email: z.email(),
  password: z.string().trim().min(1),
  rememberDevice: z.boolean().optional().default(false),
})
export type LoginInput = z.infer<typeof LoginInputSchema>

export const CurrentUserSchema = z.object({
  userId: z.string().trim(),
  // RBAC hint de UI (FR-020 partners) — o `can()` lê daqui. Default [] mantém compat.
  permissions: z.array(z.string().trim()).default([]),
})
export type CurrentUser = z.infer<typeof CurrentUserSchema>
