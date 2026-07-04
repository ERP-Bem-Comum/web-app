/**
 * Valores brutos de Estados & Municípios (isento do lint só-tokens por ser `*.values.ts`, como
 * `grid-brand.values.ts`/`dashboard.values.ts`). Espelha o mock `estados-municipios-brand`: canvas
 * levemente azulado + cores dos botões de ação circulares (verde adicionar / vermelho remover).
 */
export const geography = {
  // Fundo da página (canvas) — azul-cinza bem claro do mock.
  pageBg: '#eef1f7',
  // Botão "adicionar" (círculo verde) — verde da marca.
  addGreen: '#1f7d55',
  // Botão "remover" (círculo vermelho) — vermelho do mock.
  removeRed: '#d44856',
} as const
