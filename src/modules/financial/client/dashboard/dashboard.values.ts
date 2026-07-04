/**
 * Valores brutos do Dashboard (isento do lint só-tokens por ser `*.values.ts`, como `recon.values.ts` e
 * `grid-brand.values.ts`). Só o canvas: um azul MAIS CLARO que o `surface.canvas` compartilhado (#E7EFF8),
 * pedido da P.O., sem alterar o token global (usado por filtros/tabelas em 7 lugares).
 */
export const dashboard = {
  // Canvas azul do fundo — tom bem claro (mais claro que #E7EFF8), mantendo o matiz azul da marca.
  canvas: '#F0F5FC',
} as const
