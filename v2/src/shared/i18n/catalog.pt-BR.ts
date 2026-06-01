/**
 * Catálogo pt-BR (tags). Textos DEFAULT genéricos — a P.O. @lekadecastro refina.
 * Erro de credencial é genérico (anti-enumeração). Adicione chaves conforme as telas crescem.
 */
import type { Catalog } from './index.ts'

export const ptBR: Catalog = {
  // Login
  'auth.login.title': 'Entrar',
  'auth.login.subtitle': 'Entre com suas credenciais',
  'auth.login.email': 'E-mail',
  'auth.login.email-placeholder': 'seu@email.com',
  'auth.login.password': 'Senha',
  'auth.login.password-placeholder': '••••••••',
  'auth.login.remember-device': 'Lembrar este dispositivo',
  'auth.login.submit': 'Entrar',
  // Comum (reutilizável)
  'common.loading': 'Carregando…',
  // Erros (genéricos por ora — P.O. refina)
  'auth.error.invalid-credentials': 'E-mail ou senha inválidos.',
  'auth.error.user-disabled': 'Sua conta está desativada. Procure o administrador.',
  'auth.error.connectivity': 'Serviço temporariamente indisponível. Tente novamente.',
  'auth.error.unexpected': 'Algo deu errado. Tente novamente.',
}
