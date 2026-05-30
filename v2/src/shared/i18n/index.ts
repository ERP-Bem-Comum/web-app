/**
 * i18n — catálogo de tags (constituição §XI: strings de UI são chaves, sem literais hardcoded).
 * `createTranslator(catalog)` resolve chave→texto; ausente → a própria chave (fallback seguro,
 * nunca quebra a UI). Textos finais são da P.O. @lekadecastro; default genérico.
 */

export type Catalog = Readonly<Record<string, string>>

export type Translator = (key: string) => string

export const createTranslator =
  (catalog: Catalog): Translator =>
  (key) =>
    catalog[key] ?? key
