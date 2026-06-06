/**
 * Zod dos responses do core-api auth (boundary — §VI). Valida o que entra do backend antes de virar
 * tipo do domínio. Shapes conforme contracts/core-api-auth.md (verificado).
 */
import * as z from 'zod';

export const AuthTokensSchema = z.object({
  accessToken: z.string().trim(),
  refreshToken: z.string().trim(),
  userId: z.string().trim(),
})

export const MeSchema = z.object({
  userId: z.string().trim(),
  // RBAC hint de UI (FR-020 partners). O core-api /me entrega permissions[] (ticket AUTH-ME-PERMISSIONS);
  // default [] mantém compat caso ausente.
  permissions: z.array(z.string()).optional().default([]),
})

// Os tipos canônicos (AuthTokens, AuthUser) vivem em server/domain/session.types.ts.
// As schemas acima validam e produzem shapes assignáveis a eles (boundary §VI).
