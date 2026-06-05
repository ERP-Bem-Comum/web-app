# Cor moderna — `color-mix()`, espaços de cor, relative color

> Fonte: [MDN `color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)

## `color-mix()` — derivar cores a partir de tokens

Mistura cores num espaço de cor definido. **No projeto isto é ouro:** em vez de cunhar novos literais hex
para tints/shades/estados, **derive** do token de marca — uma fonte de verdade, menos tokens.
Baseline: Widely available (mai/2023).

```
color-mix(in <espaço>, <cor> <pct>?, <cor> <pct>?)
```

```ts
import { style } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens'

const subtleBrand = style({
  // 12% da marca sobre a superfície → fundo de chip/badge, sem novo token de cor
  background: `color-mix(in oklab, ${vars.color.brand.normal} 12%, ${vars.color.surface.default})`,
})

const overlay = style({
  // opacidade SEM rgba cru: misture com transparent
  background: `color-mix(in srgb, ${vars.color.text.primary} 50%, transparent)`,
})
```

- **Percentuais** normalizam sozinhos: `color-mix(in oklab, red 30%, blue)` → blue vira 70%. Omitidos = 50/50.
- **Misturar com `transparent`** = criar alpha (`… 20%, transparent` → 20% opaco). Substitui `rgba()` cru.

## Escolha do espaço de interpolação

| Objetivo | Espaço |
| --- | --- |
| Espaçamento perceptualmente uniforme (gradientes, tints) | **`oklab`** / `lab` |
| Evitar "cinza" no meio da transição de matiz | **`oklch`** / `lch` (polares) |
| Mistura de luz física | `xyz`, `srgb-linear` |
| Compatibilidade legada | `srgb` (evite fora disso) |

**Recomendação do projeto:** use **`oklab`/`oklch`** para tints/shades/estados — resultado perceptualmente
consistente, sem o escurecimento típico do sRGB. Espaços polares (`oklch`, `lch`) aceitam método de matiz
(`shorter hue` default, `longer hue`, `increasing/decreasing hue`).

```ts
// estado hover derivado, sem hardcode (compare com vars.color.brand.hover existente)
const hoverBg = `color-mix(in oklch, ${vars.color.brand.normal} 85%, white)`
```

## Relative color — `rgb(from …)`

Sintaxe relacionada: reescreve canais de uma cor existente. Útil quando você precisa **subir** o alpha
(o `color-mix` com `transparent` só **desce**), ou ajustar um canal isolado.

```css
/* mesma matiz, alpha forçado a 1 */
--solid: rgb(from var(--c) r g b / 1);
/* clarear em oklch mexendo só no lightness */
--lighter: oklch(from var(--brand) calc(l + 0.1) c h);
```

## Tokens e cor neste projeto

- A paleta vive em `tokens.values.ts` (marca legada **ciano `#32C6F4`** — ver ADR-0007/0008). Componentes
  só veem `vars.color.*` (resolvido em CSS vars no build).
- **Não** introduza hex cru num componente para uma variação — **derive** com `color-mix()`/relative color
  a partir do `vars.*`, ou promova um token novo em `tokens.values.ts` se a variação for reutilizável.
- Dark mode futuro: por ser tudo CSS var + `color-mix`, um tema alternativo só troca os valores-raiz; as
  derivações acompanham. Combine com `prefers-color-scheme` (ver [`responsive-a11y.md`](./responsive-a11y.md)).
