# Layout — logical properties + container queries

> Fontes: [MDN Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) ·
> [MDN Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)

## Logical properties (PADRÃO neste projeto)

Defina layout em relação ao **fluxo do texto**, não a direções físicas. `button.css.ts` já faz isso
(`paddingBlock`/`paddingInline`). **Sempre prefira a versão lógica** — prepara para i18n/RTL sem CSS extra.

- **Eixo block** = perpendicular à linha de texto (vertical em PT/EN). **Eixo inline** = ao longo da linha
  (horizontal em PT/EN).

| Físico | Lógico (use este) | camelCase no `.css.ts` |
| --- | --- | --- |
| `width` / `height` | `inline-size` / `block-size` | `inlineSize` / `blockSize` |
| `min/max-width` | `min/max-inline-size` | `minInlineSize` / `maxInlineSize` |
| `margin-top`/`-bottom` | `margin-block-start`/`-end` (atalho `margin-block`) | `marginBlock` |
| `margin-left`/`-right` | `margin-inline-start`/`-end` (atalho `margin-inline`) | `marginInline` |
| `padding-*` | `padding-block` / `padding-inline` | `paddingBlock` / `paddingInline` |
| `top/right/bottom/left` | `inset-block-*` / `inset-inline-*` (atalho `inset`) | `insetBlock` / `insetInline` / `inset` |
| `border-top` … | `border-block-start` … | `borderBlockStart` |
| `border-top-left-radius` | `border-start-start-radius` | `borderStartStartRadius` |

```ts
const panel = style({
  inlineSize: '100%',
  maxInlineSize: '65ch',        // largura de leitura
  paddingBlock: vars.space.md,  // ↕
  paddingInline: vars.space.lg, // ↔  (vira margin-right em RTL automaticamente)
  marginInline: 'auto',         // centraliza
})
```

Em RTL (`dir="rtl"`), `padding-inline-start` vira a direita automaticamente — zero stylesheet extra.
Baseline: Widely available (sizing/margin/padding/inset todos suportados nos engines atuais).

## Container queries — responsividade por COMPONENTE

Media query olha o **viewport**; container query olha o **container do componente** → o mesmo componente
se adapta em qualquer slot (sidebar estreita, main larga) sem saber onde está.

```ts
import { style } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens'

// 1) o elemento vira um container de consulta de tamanho inline
export const cardHost = style({
  containerType: 'inline-size',
  containerName: 'card',          // opcional; ou o atalho: container: 'card / inline-size'
})

// 2) estilos condicionais ao tamanho do container
export const cardTitle = style({
  fontSize: vars.font.size.md,
  '@container': {
    'card (inline-size > 30rem)': { fontSize: vars.font.size.lg },
  },
})
```

- **`container-type`**: `inline-size` (consulta só a largura — o caso comum, barato), `size` (largura **e**
  altura — exige altura definida), `normal` (só style queries).
- **`container-name`** evita casar containers aninhados por engano. Use nome quando houver aninhamento.
- **Unidades de container** (relativas ao container, não ao viewport — preferíveis dentro de componentes):
  `cqi` (1% do inline), `cqb` (1% do block), `cqw`, `cqh`, `cqmin`, `cqmax`. Ótimas com `clamp()`:
  `fontSize: 'max(1rem, 0.9rem + 1cqi)'`.
- **Gotcha:** um container **não** pode consultar o próprio tamanho (consulta os filhos). O host define
  `container-type`; os filhos usam `@container`.
- Baseline: Widely available (Chrome/Edge 105+, Firefox 110+, Safari 16+).

### Fallback (progressive enhancement)
`@container` é ignorado onde não há suporte → comece com o layout base (mobile-first) fora do `@container`
e refine para cima; nunca dependa do container query para o estado legível mínimo.
