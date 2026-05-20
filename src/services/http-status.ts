// Subset compatível com axios.HttpStatusCode — somente os códigos usados no projeto.
// Drop-in para `import { HttpStatusCode } from 'axios'`.
export const HttpStatusCode = {
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  UnprocessableEntity: 422,
  InternalServerError: 500,
  BadGateway: 502,
  ServiceUnavailable: 503,
} as const

export type HttpStatusCode = (typeof HttpStatusCode)[keyof typeof HttpStatusCode]
