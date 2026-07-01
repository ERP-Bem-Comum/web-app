/**
 * set-password.copy — seletor de copy PURO (§XI, ADR-0009): mapeia o `variant` ('reset' | 'activate')
 * para o conjunto de CHAVES i18n da tela de "definir senha" e o alvo do CTA no estado sem-form.
 * Zero React (é reusado tanto pela page quanto por node:test). A page resolve as tags → texto via `t`.
 *
 * A tela é a mesma feature (#038 reset · #039 activate): token → nova senha + confirmação + checklist
 * → `POST /auth/reset-password`. Só o TEXTO e o destino do link inválido mudam por variant. As
 * chaves de checklist (`auth.reset.rule.*`) e o erro genérico (`auth.error.*`) são compartilhados.
 */

/** Variantes da tela de definir senha. Redefinir senha (#038) × Ativar conta (#039). */
export type SetPasswordVariant = 'reset' | 'activate'

/** Alvo de navegação do CTA no estado "link/convite inválido" (e do "voltar" no form). */
export type SetPasswordInvalidTarget = '/recuperar-senha' | '/login'

/** Conjunto de CHAVES i18n + destino do CTA para uma variant. A View resolve as chaves via `t`. */
export type SetPasswordCopy = Readonly<{
  titleKey: string
  subtitleKey: string
  submitKey: string
  successTitleKey: string
  successBodyKey: string
  successCtaKey: string
  invalidTitleKey: string
  invalidBodyKey: string
  invalidCtaKey: string
  /** Texto do alerta de erro 400 (token inválido/expirado/usado) — mensagem única por variant. */
  invalidErrorKey: string
  /** Para onde o CTA de "link inválido" (e o "voltar" do form) navega. */
  invalidTarget: SetPasswordInvalidTarget
}>

const RESET_COPY: SetPasswordCopy = {
  titleKey: 'auth.reset.title',
  subtitleKey: 'auth.reset.subtitle',
  submitKey: 'auth.reset.submit',
  successTitleKey: 'auth.reset.success-title',
  successBodyKey: 'auth.reset.success-body',
  successCtaKey: 'auth.reset.success-cta',
  invalidTitleKey: 'auth.reset.invalid-link-title',
  invalidBodyKey: 'auth.reset.invalid-link-body',
  invalidCtaKey: 'auth.reset.invalid-link-cta',
  invalidErrorKey: 'auth.reset.error.link-invalid',
  invalidTarget: '/recuperar-senha',
}

const ACTIVATE_COPY: SetPasswordCopy = {
  titleKey: 'auth.activate.title',
  subtitleKey: 'auth.activate.subtitle',
  submitKey: 'auth.activate.submit',
  successTitleKey: 'auth.activate.success-title',
  successBodyKey: 'auth.activate.success-body',
  successCtaKey: 'auth.activate.success-cta',
  invalidTitleKey: 'auth.activate.invalid-link-title',
  invalidBodyKey: 'auth.activate.invalid-link-body',
  invalidCtaKey: 'auth.activate.invalid-link-cta',
  invalidErrorKey: 'auth.activate.error.link-invalid',
  invalidTarget: '/login',
}

/** Derivação PURA: variant → copy. Exaustivo (união literal); nova variant quebra a compilação. */
export const setPasswordCopy = (variant: SetPasswordVariant): SetPasswordCopy => {
  switch (variant) {
    case 'reset':
      return RESET_COPY
    case 'activate':
      return ACTIVATE_COPY
  }
}

/**
 * Resolve o errorTag (vindo do binding) para a CHAVE i18n do texto do alerta, por variant.
 * O binding mapeia o 400 do token para `auth.reset.error.link-invalid` (fonte única do subcaso);
 * aqui trocamos SÓ esse texto pela mensagem da variant. Os demais (rede/genérico) são compartilhados.
 */
export const setPasswordErrorKey = (variant: SetPasswordVariant, errorTag: string): string =>
  errorTag === 'auth.reset.error.link-invalid' ? setPasswordCopy(variant).invalidErrorKey : errorTag
