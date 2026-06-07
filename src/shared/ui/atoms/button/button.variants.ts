/**
 * Lógica PURA do estado visual do Button (sem CSS/DOM) — testável por node:test.
 * Separada do `.css.ts` (que exige o compilador do vanilla-extract).
 *
 * Precedência: `loading` > `disabled` > `normal` (decisão I1: loading comunica carregando;
 * o texto continua vindo de `children`/i18n — o Button não troca o rótulo).
 */
export type ButtonState = 'normal' | 'disabled' | 'loading'

export function resolveButtonState(disabled: boolean, loading: boolean): ButtonState {
  if (loading) return 'loading'
  if (disabled) return 'disabled'
  return 'normal'
}
