/**
 * Catálogo pt-BR (tags). Textos DEFAULT genéricos — a P.O. @lekadecastro refina.
 * Erro de credencial é genérico (anti-enumeração). Adicione chaves conforme as telas crescem.
 */
import type { Catalog } from './index.ts'

export const ptBR: Catalog = {
  // Login
  'auth.login.title': 'Entrar',
  'auth.login.email': 'E-mail',
  'auth.login.password': 'Senha',
  'auth.login.remember-device': 'Lembrar este dispositivo',
  'auth.login.submit': 'Entrar',
  // Erros (genéricos por ora — P.O. refina)
  'auth.error.invalid-credentials': 'E-mail ou senha inválidos.',
  'auth.error.user-disabled': 'Sua conta está desativada. Procure o administrador.',
  'auth.error.connectivity': 'Serviço temporariamente indisponível. Tente novamente.',
  'auth.error.unexpected': 'Algo deu errado. Tente novamente.',
}
