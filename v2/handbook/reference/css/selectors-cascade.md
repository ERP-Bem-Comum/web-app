# Seletores modernos e cascata

> Fontes: [MDN `:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) ·
> [MDN `@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)

## `:is()` e `:where()` — agrupar sem repetir

Ambos casam qualquer seletor da lista. **Diferença crucial de especificidade:**

- **`:is(...)`** assume a especificidade do **seletor mais específico** da lista.
- **`:where(...)`** tem **especificidade ZERO** — ideal para estilos-base fáceis de sobrescrever.

```ts
// no vanilla-extract, via `selectors` ou `globalStyle`
const heading = style({
  selectors: {
    '&:is(h1, h2, h3)': { fontFamily: vars.font.family.heading },
  },
})
```

No design system, prefira `:where()` para resets/bases (não inflam a especificidade) e deixe os
componentes sobreporem com facilidade.

## `:has()` — o seletor de pai/anterior

Casa um elemento **se** ele contém (ou é seguido por) algo. Primeiro seletor "para cima"/"para trás".
Baseline: **Newly available (dez/2023)** — suportado em todos os engines atuais.

```ts
// um campo que fica vermelho quando contém um input inválido
const field = style({
  selectors: {
    '&:has(input:invalid)': { borderColor: vars.color.feedback.errorText },
    // irmão: um label logo após um input marcado
    '&:has(+ [data-error])': { color: vars.color.feedback.errorText },
  },
})
```

- **Lógica:** OR = vírgula `:has(a, b)`; AND = encadear `:has(a):has(b)`.
- **Direto vs descendente:** `:has(> .x)` (filho direto) é mais barato que `:has(.x)` (qualquer descendente).
- **Especificidade:** igual ao argumento mais específico (como `:is()`).
- **⚠️ Performance:** não ancore em elementos enormes (`body:has(...)`, `:root:has(...)`, `*:has(...)`) —
  reavalia a cada mutação do DOM. Ancore em containers pequenos e use combinadores apertados
  (`.gallery:has(> img[data-loading])`). Para tornar "forgiving" (não quebrar o bloco se algo falhar),
  embrulhe em `:where(...)`.

## Cascade layers — `@layer`

Controla **precedência por camada**, ignorando especificidade entre camadas. Resolve guerras de
especificidade sem `!important`. Baseline: Widely available (mar/2022).

```css
/* declare a ORDEM uma vez (última = maior prioridade entre normais) */
@layer reset, tokens, base, components, utilities;

@layer components {
  .btn { background: var(--brand); }   /* perde p/ utilities mesmo com + especificidade */
}
@layer utilities {
  .mt-0 { margin-block-start: 0; }      /* vence por estar em camada posterior */
}
```

Regras-chave:
- **Normais:** fora de qualquer layer **vence** layers; entre layers, a **declarada por último** vence;
  especificidade só desempata **dentro** da mesma layer.
- **`!important`:** ordem **inverte** — a **primeira** layer declarada vence. (Mais um motivo para evitar
  `!important`.)
- **Aninhar:** `@layer framework.layout { }` ou `@layer a { @layer b {} }`.
- **Importar dentro de layer:** `@import "x.css" layer(utilities);`.

### No vanilla-extract
Use a API [`layer()` / `globalLayer()`](../vanilla-extract/) para criar camadas tipadas e atribuir
`style({ '@layer': ... })`/recipes a elas — assim a ordem de import dos `.css.ts` deixa de importar para a
cascata. Mantém o design system previsível conforme cresce (reset < tokens < base < components < utilities).
