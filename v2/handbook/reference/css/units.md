# Unidades de CSS

> Fontes: [blog.saeloun.com/2024/07/22/css-units](https://blog.saeloun.com/2024/07/22/css-units/) ·
> [web.dev/blog/viewport-units](https://web.dev/blog/viewport-units) ·
> [MDN `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)

## Regra de ouro do projeto

Os tokens (`vars.space.*`, `vars.font.size.*`, `vars.radius.*`) já são definidos em **`rem`** — então
componentes herdam escala acessível "de graça". Você raramente escreve uma unidade crua; quando precisar
(viewport, container, `clamp`), siga as recomendações abaixo.

## Relativas a fonte (preferidas para tipografia/espaço)

| Unidade | Relativa a | Quando usar |
| --- | --- | --- |
| `rem` | `font-size` do `<html>` (raiz) | **Default** para tipografia, espaçamento, radius. Previsível, escala com zoom do usuário. É o que os tokens usam. |
| `em` | `font-size` do **próprio elemento/pai** | Espaço que deve escalar com o texto local (ex.: padding de um botão proporcional à fonte). Cuidado: **composição** (aninhados multiplicam). |
| `ch` | largura do `0` da fonte | Largura de leitura/medida (`max-inline-size: 65ch` para corpo de texto legível). |
| `lh` / `rlh` | `line-height` do elemento / da raiz | Ritmo vertical amarrado à entrelinha. |
| `ex`, `cap`, `ic` | x-height / altura de maiúsculas / largura de ideograma | Ajuste fino tipográfico (raro). |

```ts
// largura de leitura ideal para um parágrafo
const prose = style({ maxInlineSize: '65ch', fontFamily: vars.font.family.body })
```

## Percentual e `fr`

- **`%`** — relativo à **dimensão correspondente do pai**. Bom para larguras fluidas; ⚠️ `padding`/`margin`
  em `%` são relativos à **largura** do pai (até no eixo vertical).
- **`fr`** — fração do espaço livre no **CSS Grid** (`grid-template-columns: 2fr 1fr`). Não é uma unidade
  de comprimento; só existe em contexto de grid.

## Viewport — clássicas e dinâmicas

`1vw`/`1vh` = 1% da largura/altura do viewport. `vmin`/`vmax` = 1% da **menor**/**maior** dimensão.

**O problema mobile:** `100vh` conta a tela com as barras do navegador **retraídas**, então um herói
`height: 100vh` é cortado quando a barra de endereço está visível. A spec resolveu com **três estados**:

| Prefixo | Significa | Use para |
| --- | --- | --- |
| `lv*` (`lvh`, `lvw`, `lvi`, `lvb`) | viewport **grande** — barras retraídas (máximo) | Fundos/decoração que podem passar do visível. |
| `sv*` (`svh`, `svw`, …) | viewport **pequeno** — barras expandidas (mínimo garantido) | Conteúdo que **precisa** caber sem scroll com a barra aberta (CTA, form). |
| `dv*` (`dvh`, `dvw`, …) | **dinâmico** — muda em tempo real conforme as barras | Heróis/modais full-height que devem se adaptar suavemente. |

Eixos lógicos: `*vi` = 1% do eixo **inline**, `*vb` = 1% do eixo **block** (combinam com logical properties).

⚠️ **Gotchas:**
- `dvh` **não** atualiza a 60fps — os browsers fazem throttle/debounce enquanto a barra desliza; pode
  haver micro-desalinhamento durante o scroll. Para animação suave, prefira `svh`/`lvh` fixos.
- Unidades de viewport **não** descontam a barra de rolagem clássica → `100vw` pode causar overflow
  horizontal. **Não** as use para componentes — para componentes, use **unidades de container** (ver
  [`layout.md`](./layout.md)).
- Suporte: `dvh`/`svh`/`lvh` em todos os engines (Chrome/Edge 108+, Firefox 101+, Safari 15.4+).

## `clamp()`, `min()`, `max()` — fluido sem media query

`clamp(MIN, PREFERIDO, MAX)` resolve como `max(MIN, min(PREFERIDO, MAX))`. Aritmética (`+ - * /`) é
permitida sem `calc()`.

```css
/* tipografia fluida: nunca < 1rem, nunca > 2rem, escala no meio */
font-size: clamp(1rem, 0.5rem + 2vw, 2rem);
```

```ts
// no vanilla-extract o valor é uma string:
const heading = style({ fontSize: 'clamp(1.25rem, 1rem + 1.5vw, 2rem)' })
```

- `max(1.2rem, 1.2vw)` → define um **piso**. `min(1000px, 70%)` → define um **teto** (ex.: largura máxima).
- ⚠️ **Acessibilidade (WCAG 1.4.4):** ao usar `clamp()` com unidade de viewport em `font-size`, o `MAX`
  deve ser **≥ 2× o `MIN`**, senão o texto não escala até 200% no zoom. `clamp(1rem, 2.5vw, 2rem)` ✓;
  `clamp(1.5rem, 2.5vw, 2rem)` ✗.
- Baseline: Widely available desde jul/2020.

## Absolutas

`px` é tecnicamente relativa ao DPI; serve para o que **não** deve escalar (borda hairline). `cm`, `mm`,
`in`, `pt`, `pc` são para **impressão** — não use em tela.

⚠️ **No projeto NÃO há exceção:** o lint só-tokens barra **todo** `px` cru em componentes do design
system — inclusive `1px`, inclusive dentro de template literal (`` `1px solid ${vars...}` ``). Para borda
hairline use o **token** `vars.borderWidth.thin` (1px), não o literal. Ex.:
`` border: `${vars.borderWidth.thin} solid ${vars.color.border.default}` ``.
