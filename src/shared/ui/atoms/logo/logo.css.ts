import { style } from '@vanilla-extract/css'

// Átomo Logo. Burro e genérico: NÃO embute o caminho da marca (src vem por prop).
// "CSS mínimo" (spec 005): só regras ESTÁTICAS. O tamanho é dinâmico por instância
// (LogoProps.size, default 48) e vai como ATRIBUTOS width/height do <img> no componente
// — zero-runtime do vanilla-extract não comporta classe estática para valor por instância.
export const logo = style({
  display: 'block',
  // mantém a proporção da arte mesmo se só um dos atributos casar com o intrínseco
  objectFit: 'contain',
  // num flex/inline-flex (ex.: header), não deixa a logo encolher abaixo do tamanho pedido
  flexShrink: 0,
})
