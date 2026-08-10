/**
 * Helpers PUROS de "Idade dos filhos" (texto livre ↔ int[]) — extraídos do controller (#040) p/ reuso
 * pelo form do Autocadastro sem arrastar React. Comportamento idêntico ao original; testáveis isolados.
 */

/** Extrai todos os inteiros não-negativos do texto, na ordem (ex.: "5 anos, 12 anos" → [5, 12]). */
export const parseChildrenAges = (raw: string): number[] =>
  (raw.match(/\d+/g) ?? []).map((d) => Number.parseInt(d, 10)).filter((n) => Number.isInteger(n) && n >= 0)

/** Formata int[] como texto legível p/ hidratação (ex.: [5, 12] → "5, 12"). */
export const formatChildrenAges = (ages: readonly number[] | undefined): string =>
  ages === undefined ? '' : ages.join(', ')
