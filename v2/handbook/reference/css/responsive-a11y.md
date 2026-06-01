# Responsivo e acessível — media queries de preferência + foco

> Fonte: [MDN `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
> e features de acessibilidade relacionadas.

## `prefers-reduced-motion` — respeite quem desabilitou animação

Para usuários com transtorno vestibular. **Toda** animação/transição não-trivial deve ter este guarda.
Baseline: Widely available (jan/2020).

```ts
const card = style({
  transitionProperty: 'transform, box-shadow',
  transitionDuration: '150ms',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transitionDuration: '0.01ms',   // efetivamente sem animação, sem quebrar fluxo
      // ou troque por uma alternativa sutil (opacity) em vez de remover
    },
  },
})
```

Valores: `reduce` (usuário pediu menos movimento) e `no-preference`. Boas práticas: **substitua**, não
apenas remova (ofereça transição sutil); coloque a regra `reduce` **depois** da default (mesma
especificidade) para sobrepor; foque em não escalar/transladar objetos grandes.

> Convém um **reset global** (em `src/start.ts`/layout, via `globalStyle`) zerando animações sob `reduce`
> para o app inteiro, e cada componente refina se precisar.

## `prefers-color-scheme` — claro/escuro

```ts
'@media': {
  '(prefers-color-scheme: dark)': { /* aplica o tema escuro */ },
}
```

No projeto, dark mode é decisão de **tema de tokens** (trocar valores-raiz com `createTheme`/
`createGlobalTheme`), não cores ad-hoc por componente. O `@media` apenas **seleciona** qual tema aplicar à
raiz; os componentes continuam em `vars.*` e não mudam. Ver [`color.md`](./color.md) e
[`../vanilla-extract/`](../vanilla-extract/).

## `prefers-contrast` e `forced-colors`

```ts
'@media': {
  '(prefers-contrast: more)': { /* engrosse bordas, aumente contraste do texto */ },
}
```

- **`prefers-contrast`**: `more` | `less` | `custom`. Reforce borda/contraste sob `more`.
- **`forced-colors: active`** (modo de alto contraste do SO / Windows High Contrast): o SO **substitui**
  suas cores. Não lute contra — use `forced-color-adjust: auto` (default), confie nas *system colors*
  (`Canvas`, `CanvasText`, `ButtonText`, `Highlight`), e garanta que estados (foco, selecionado) não
  dependam **só** de cor. Use `@media (forced-colors: active)` apenas para reforçar contornos/ícones.

## `:focus-visible` — foco só quando útil

Mostra o anel de foco para navegação por teclado, **não** no clique de mouse. **Padrão obrigatório** no
design system — o `button.css.ts` já faz, usando os tokens de anel de foco:

```ts
selectors: {
  '&:focus-visible': {
    outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
    outlineOffset: vars.focusRing.offset,
  },
}
```

Regras:
- **Nunca** `outline: none` sem repor um indicador visível (WCAG 2.4.7). Prefira `outline` (respeita
  `forced-colors`) a `box-shadow` para o anel.
- Use `:focus-visible`, não `:focus`, para não poluir o clique de ponteiro.
- `accent-color: var(--brand)` estiliza checkbox/radio/range nativos com a cor da marca, mantendo a11y
  nativa — barato e acessível (combine com `vars.color.brand.normal`).

## Mobile-first + progressive enhancement

Escreva o estado base legível **sem** depender de container/media query; refine **para cima**. Combine
unidades certas ([`units.md`](./units.md)) + container queries ([`layout.md`](./layout.md)) para
responsividade por componente, reservando media queries de viewport para layout de página/shell.
