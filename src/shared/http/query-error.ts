/**
 * QueryError — a ÚNICA subclasse de Error permitida no projeto (constituição §II).
 * Ponte entre Result/AppError e a API de erro do TanStack Query (queryFn/mutationFn).
 * Vive em shared/http; usada só na borda do client (adapters/queries).
 */
import type { AppError } from './app-error.types.ts'

export class QueryError extends Error {
  readonly appError: AppError

  constructor(appError: AppError) {
    super(`[QueryError] ${appError.kind}`)
    this.name = 'QueryError'
    this.appError = appError
  }
}

export const isQueryError = (e: unknown): e is QueryError => e instanceof QueryError
