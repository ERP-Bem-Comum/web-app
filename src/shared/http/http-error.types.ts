/**
 * HttpError — erro de TRANSPORTE (vive no servidor / borda de I/O).
 * União discriminada por `kind`. Convertido em AppError (semântico) via map-to-app-error.
 */
export type HttpError =
  | Readonly<{ kind: 'network' }>
  | Readonly<{ kind: 'http'; status: number; body: unknown }>
  | Readonly<{ kind: 'parse' }>
  | Readonly<{ kind: 'timeout' }>
  | Readonly<{ kind: 'aborted' }>
