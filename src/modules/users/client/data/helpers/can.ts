/**
 * RBAC do client (Gestão de Usuários) — verificação PURA de permissão. A UI usa `can(granted, required)`
 * para ocultar/desabilitar ações conforme o RBAC do core-api. `granted` vem de `useCurrentUser`
 * (`permissions[]` do `/me`). Slugs do core-api (spec 005/006).
 */
export const USER_PERMISSIONS = [
  'user:list',
  'user:read',
  'user:create',
  'user:update',
  'user:activate',
  'user:deactivate',
] as const

export type UserPermission = (typeof USER_PERMISSIONS)[number]

const isUserPermission = (p: string): p is UserPermission =>
  (USER_PERMISSIONS as readonly string[]).includes(p)

export const grantedPermissions = (
  permissions: readonly string[] | undefined,
): readonly UserPermission[] => (permissions ?? []).filter(isUserPermission)

export const can = (granted: readonly UserPermission[], required: UserPermission): boolean =>
  granted.includes(required)
