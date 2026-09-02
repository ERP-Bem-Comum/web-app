/**
 * Slug de erro do schema → tag i18n, para os formulários de parceiro (specs/114, #359).
 *
 * O controller passou a carregar o SLUG que o Zod produziu (`Record<string, string>`), em vez do
 * booleano que só dizia "falhou". Este mapa é quem transforma o slug numa frase — e ele fica aqui,
 * e não em cada view, porque a mesma regra vale para os quatro tipos de parceiro: o Fornecedor e o
 * ACT não devem explicar de formas diferentes que a agência não cabe no campo.
 *
 * ⚠️ Devolve a TAG, nunca o texto. Quem traduz é a view, que já tem o `t` — manter a tradução lá
 * preserva a view como o único lugar que fala com o catálogo (§XI) e deixa este módulo puro.
 *
 * ⚠️ E o fallback é a razão pela qual esta fatia pôde ser incremental: regra ainda SEM erro nomeado
 * produz uma mensagem do próprio Zod, em inglês ("Too big: expected string to have <=20…"), que não
 * está neste mapa e cairia como texto cru na tela. `formErrorTag` a converte na frase genérica que
 * já existia. Nomear as demais regras é acrescentar linhas aqui — nunca mexer nas views de novo.
 */

/**
 * As regras nomeadas hoje: banco e PIX (a primeira leva pedida na #359), mais o `cnpj-invalid`, que
 * existia nos models desde sempre e morria no controller — nunca chegou a uma tela até agora.
 *
 * Os slugs são `kebab-case` EN porque são erros internos; o texto PT vive no catálogo.
 */
const FORM_ERROR_TAGS: Readonly<Record<string, string>> = {
  'bank-required': 'partners.form.error.bankRequired',
  'bank-too-long': 'partners.form.error.bankTooLong',
  'agency-required': 'partners.form.error.agencyRequired',
  'agency-too-long': 'partners.form.error.agencyTooLong',
  'account-number-required': 'partners.form.error.accountNumberRequired',
  'account-number-too-long': 'partners.form.error.accountNumberTooLong',
  'check-digit-too-long': 'partners.form.error.checkDigitTooLong',
  'pix-key-type-invalid': 'partners.form.error.pixKeyTypeInvalid',
  'pix-key-required': 'partners.form.error.pixKeyRequired',
  'pix-key-too-long': 'partners.form.error.pixKeyTooLong',
  'cnpj-invalid': 'partners.form.error.cnpjInvalid',
  // Achado pelo próprio teste de governança desta fatia: o `cpf-invalid` do Colaborador era o SEGUNDO
  // erro nomeado sem frase, pela mesma razão do `cnpj-invalid`. Só apareceu porque o CA7 varre os
  // models em vez de confiar numa lista escrita à mão.
  'cpf-invalid': 'partners.form.error.cpfInvalid',
  // Regras do CONTROLLER do ACT — não vêm do Zod, são escritas à mão lá. `transfer-target-required`
  // é regra de banco/PIX (falta um dos dois); `end-date-not-after-start` entrou de carona porque a
  // mudança de tipo já tocava a linha.
  'transfer-target-required': 'partners.form.error.transferTargetRequired',
  'end-date-not-after-start': 'partners.form.error.endDateNotAfterStart',
}

/** Os slugs com tradução — só para o teste de governança da specs/114 (CA7). */
export const NAMED_FORM_ERROR_SLUGS: readonly string[] = Object.keys(FORM_ERROR_TAGS)

/**
 * A tag da mensagem para um campo. `undefined` = campo sem erro → `null` (a view não renderiza nada).
 *
 * `fallback` é a tag genérica do formulário ("Verifique este campo."), usada quando o slug não é
 * conhecido — o que hoje significa "regra ainda não nomeada", e nunca "erro sem mensagem".
 */
export const formErrorTag = (slug: string | undefined, fallback: string): string | null =>
  slug === undefined ? null : (FORM_ERROR_TAGS[slug] ?? fallback)
