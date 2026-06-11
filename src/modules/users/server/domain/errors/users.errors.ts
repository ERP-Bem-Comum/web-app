/**
 * UsersError — erro do módulo de Gestão de Usuários propagado pelo BFF (string union). A UI nunca olha
 * status HTTP — trata só a tag i18n derivada via `usersErrorTag` (§V). Espelha o `PartnersError`.
 */
export type UsersError =
  | 'not-found'
  | 'validation'
  | 'email-taken'   // 409 email-already-registered (criação) → mensagem específica
  | 'invalid-current-password' // 401 na troca de senha: senha atual incorreta
  | 'password-weak'            // 422 password-too-common: senha vazada/comum
  | 'password-too-short'       // 422 password-too-short: senha abaixo do mínimo da política (#32)
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'connectivity'
  | 'server'
