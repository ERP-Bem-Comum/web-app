/**
 * Política de senha do CLIENT (checklist da tela "Trocar Senha") — PURA, sem I/O. O TAMANHO vem da
 * fonte única do backend (#32: min 12 / max 128), passado por `limits`; o default seguro {12,128}
 * cobre indisponibilidade da fonte (nunca mais permissivo que o backend). A complexidade
 * (upper/lower/number/special) é exigência ADICIONAL do front (stricter): toda senha que passa aqui é
 * aceita no backend. A blocklist de senhas comuns do backend é tratada à parte (tag `password-weak`).
 */
export type PasswordLimits = Readonly<{ minLength: number; maxLength: number }>

// Fallback seguro (D4/D5): usado quando a fonte única (GET /password-policy) não está disponível.
export const DEFAULT_PASSWORD_LIMITS: PasswordLimits = { minLength: 12, maxLength: 128 }

export type PasswordChecks = Readonly<{
  length: boolean // entre minLength e maxLength (da fonte única; default 12–128)
  upper: boolean // ao menos uma maiúscula
  lower: boolean // ao menos uma minúscula
  number: boolean // ao menos um dígito
  special: boolean // ao menos um símbolo (não alfanumérico)
}>

export const evaluatePassword = (pw: string, limits: PasswordLimits = DEFAULT_PASSWORD_LIMITS): PasswordChecks => ({
  length: pw.length >= limits.minLength && pw.length <= limits.maxLength,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  number: /[0-9]/.test(pw),
  special: /[^A-Za-z0-9]/.test(pw),
})

export const passwordMeetsPolicy = (pw: string, limits: PasswordLimits = DEFAULT_PASSWORD_LIMITS): boolean => {
  const c = evaluatePassword(pw, limits)
  return c.length && c.upper && c.lower && c.number && c.special
}

/** As 5 regras na ordem de exibição (chave + se passou), para a UI iterar. */
export const PASSWORD_RULE_KEYS = ['length', 'upper', 'lower', 'number', 'special'] as const
export type PasswordRuleKey = (typeof PASSWORD_RULE_KEYS)[number]
