import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import { ResultAsync, err, ok } from 'neverthrow'

/**
 * Converte fp-ts TaskEither<L, R> para neverthrow ResultAsync<R, L>
 */
export function teToResultAsync<L, R>(te: TE.TaskEither<L, R>): ResultAsync<R, L> {
  return ResultAsync.fromPromise(
    te().then((result) =>
      E.isLeft(result) ? Promise.reject(result.left) : Promise.resolve(result.right),
    ),
    (e) => e as L,
  )
}

/**
 * Converte neverthrow ResultAsync<R, L> para fp-ts TaskEither<L, R>
 */
export function resultAsyncToTe<L, R>(ra: ResultAsync<R, L>): TE.TaskEither<L, R> {
  return TE.tryCatch(
    () =>
      Promise.resolve(ra).then((result) =>
        result.isErr() ? Promise.reject(result.error) : Promise.resolve(result.value),
      ),
    (e) => e as L,
  )
}
