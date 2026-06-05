/**
 * Eventos de auth (CLIENT) — §XII: tipos de evento client vivem em `client/data` (o client não importa
 * server/domain). Fatos no passado. Emitidos pelo `client/usecase`, assinados pelo `view-model`.
 */
export type AuthEvent =
  | Readonly<{ type: 'UsuarioAutenticado'; userId: string }>
  | Readonly<{ type: 'SessaoEncerrada' }>
