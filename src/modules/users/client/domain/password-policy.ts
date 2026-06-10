/**
 * Política de senha do CLIENT (checklist da tela "Redefinir Senha") — PURA, sem I/O. Espelha as regras
 * exibidas no formulário. É mais rígida que a policy do core-api (min 8 / max 128, sem complexidade);
 * como o backend é mais permissivo, qualquer senha que passe aqui é aceita lá (a blocklist de senhas
 * comuns do backend é tratada à parte, via tag `password-weak`).
 */
export type PasswordChecks = Readonly<{
  length: boolean // 8–15 caracteres
  upper: boolean // ao menos uma maiúscula
  lower: boolean // ao menos uma minúscula
  number: boolean // ao menos um dígito
  special: boolean // ao menos um símbolo (não alfanumérico)
}>

export const evaluatePassword = (pw: string): PasswordChecks => ({
  length: pw.length >= 8 && pw.length <= 15,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  number: /[0-9]/.test(pw),
  special: /[^A-Za-z0-9]/.test(pw),
})

export const passwordMeetsPolicy = (pw: string): boolean => {
  const c = evaluatePassword(pw)
  return c.length && c.upper && c.lower && c.number && c.special
}

/** As 5 regras na ordem de exibição (chave + se passou), para a UI iterar. */
export const PASSWORD_RULE_KEYS = ['length', 'upper', 'lower', 'number', 'special'] as const
export type PasswordRuleKey = (typeof PASSWORD_RULE_KEYS)[number]
