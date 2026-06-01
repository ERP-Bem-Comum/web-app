# CSS moderno — referência do projeto

> Fonte de verdade do **`css-expert`**. "Melhor CSS possível" **neste repositório** não é CSS genérico:
> é **CSS moderno** expresso pelos **idiomas do vanilla-extract** (`.css.ts`, zero-runtime), dentro da
> **governança de tokens** (só `vars.*`) e da **hierarquia Atomic Design** — tudo cobrado por lint.

## As quatro dimensões de "bom CSS" aqui

1. **CSS moderno** — logical properties, container queries, `:has()`, cascade layers, `color-mix()`,
   `clamp()`, unidades certas. Docs nesta pasta.
2. **Idiomas do vanilla-extract** — `style`, `styleVariants`, `recipes`, `sprinkles`, `createThemeContract`.
   Fonte: [`../vanilla-extract/`](../vanilla-extract/).
3. **Tokens-only** — nunca cor/medida crua; sempre `vars.*` de `#shared/ui/tokens`. Governança e lint:
   [`../design-system/lint-enforcement.md`](../design-system/lint-enforcement.md).
4. **Acessibilidade** — `:focus-visible`, `prefers-reduced-motion`, `prefers-color-scheme`,
   `forced-colors`. Doc: [`responsive-a11y.md`](./responsive-a11y.md).

## Índice

| Doc | Cobre |
| --- | --- |
| [`units.md`](./units.md) | Unidades: `rem`/`em`, `%`, viewport (`vw`/`vh` + dinâmicas `dvh`/`svh`/`lvh`), `ch`, `fr`, unidades de container (`cqi`…), e `clamp()`/`min()`/`max()` |
| [`layout.md`](./layout.md) | Logical properties (`inline-size`, `padding-block`, `inset`…) + container queries (`container-type`, `@container`) |
| [`selectors-cascade.md`](./selectors-cascade.md) | `:has()`, `:is()`/`:where()`, cascade layers (`@layer`) |
| [`color.md`](./color.md) | `color-mix()`, espaços de cor (`oklch`/`oklab`), relative color (`rgb(from …)`) |
| [`responsive-a11y.md`](./responsive-a11y.md) | Media queries de preferência do usuário (motion/color-scheme/contrast/forced-colors) + `:focus-visible` |

## Política de adoção (Baseline)

Use só features **Baseline Widely available** (ou Newly available com fallback). Status anotado em cada
doc. Resumo do que já é seguro e recomendado neste projeto:

- **Widely available:** logical properties, `@layer`, `clamp()/min()/max()`, `color-mix()`, container
  queries, `prefers-reduced-motion`, `:focus-visible`, unidades de viewport dinâmicas (`dvh`/`svh`/`lvh`).
- **Newly available (use com critério):** `:has()` (dez/2023) — ótimo, mas evite âncoras largas (perf).

## Como isto vira `.css.ts` (mapa rápido)

O vanilla-extract usa **camelCase** para propriedades e o objeto de `style()`. Exemplos do mundo real
estão em `src/shared/ui/atoms/button/button.css.ts`.

```ts
import { style } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens'

export const card = style({
  // logical properties (NÃO use padding-left/top — veja layout.md)
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.raised,
  boxShadow: vars.shadow.card,
  // unidade de container, não de viewport, para componentes (veja layout.md + units.md)
  containerType: 'inline-size',
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})
```

**Tokens disponíveis** (`vars.*`, de `tokens.values.ts`): `color.{brand,surface,text,border,feedback}.*`,
`space.{xs,sm,md,lg,xl}`, `radius.{sm,md,lg}`, `font.{family,size,weight}.*`, `shadow.card`,
`focusRing.{width,offset}`. Precisa de um valor que não existe? **Não cague um literal cru** — proponha um
token novo em `tokens.values.ts` (ADR-0007).
