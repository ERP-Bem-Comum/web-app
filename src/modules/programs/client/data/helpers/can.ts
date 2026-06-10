/**
 * RBAC do client (Gestão de Programas) — verificação PURA de permissão. A UI usa `can(granted, required)`
 * para ocultar/desabilitar ações conforme o RBAC do core-api. Slugs do core-api (`PROGRAM_PERMISSION`).
 */
export const PROGRAM_PERMISSIONS = ['program:read', 'program:write', 'program:deactivate'] as const

export type ProgramPermission = (typeof PROGRAM_PERMISSIONS)[number]

const isProgramPermission = (p: string): p is ProgramPermission =>
  (PROGRAM_PERMISSIONS as readonly string[]).includes(p)

export const grantedPermissions = (
  permissions: readonly string[] | undefined,
): readonly ProgramPermission[] => (permissions ?? []).filter(isProgramPermission)

export const can = (granted: readonly ProgramPermission[], required: ProgramPermission): boolean =>
  granted.includes(required)
