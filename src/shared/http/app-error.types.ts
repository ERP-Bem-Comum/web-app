/**
 * AppError — erro SEMÂNTICO que a UI entende. A UI nunca olha status HTTP, só `kind`.
 * `issues` (validation) vem [] do core-api (que não detalha validação); o BFF preenche
 * quando faz validação Zod local antes de proxiar.
 */
export type AppError =
  | Readonly<{ kind: 'auth:expired' }>
  | Readonly<{ kind: 'auth:forbidden' }>
  | Readonly<{ kind: 'not-found' }>
  | Readonly<{ kind: 'validation'; issues: readonly string[] }>
  | Readonly<{ kind: 'conflict' }>
  | Readonly<{ kind: 'server' }>
  | Readonly<{ kind: 'connectivity' }>
  | Readonly<{ kind: 'bad-gateway' }>
  | Readonly<{ kind: 'unknown'; status?: number }>
