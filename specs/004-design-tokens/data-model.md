# Data Model — Design Tokens

Entidades de token (estrutura do contrato) e seus valores no tema **claro** (fiéis à v1). Nomes em EN (constituição); valores ilustrativos a fixar na implementação/tasks.

## Contrato de tokens (estrutura — `contract.css.ts`)

```
color
  brand        { normal, hover, onBrand, disabled, onDisabled }
  surface      { default, raised }            # card / fundos
  text         { primary, secondary, muted, onBrand }
  border       { default, focus }
  feedback     { errorBg, errorText }
radius         { sm, md, lg }
space          { xs, sm, md, lg, xl }
font
  family       { heading, body, mono }        # com fallback de sistema
  size         { xs, sm, md, lg, xl }
  weight       { regular, medium, semibold, bold }
shadow         { card }
```

> A estrutura acima é o **contrato** (`createThemeContract`). Cada folha é um token referenciável e type-checked. Um segundo conjunto de valores (ex.: dark) satisfaz o mesmo contrato.

## Valores — tema claro (fidelidade v1)

| Token | Valor | Origem (v1) |
| :-- | :-- | :-- |
| `color.brand.normal` | `#32C6F4` | botão primário login |
| `color.brand.hover` | `#76D9F8` | hover do botão |
| `color.brand.onBrand` | `#000000` | texto preto sobre ciano |
| `color.brand.disabled` | `#E0E0E0` | botão disabled |
| `color.brand.onDisabled` | `#6F6F6F` | texto disabled |
| `color.surface.default` | `#ffffff` | card branco / paper |
| `color.surface.raised` | `#ffffff` | (igual por ora) |
| `color.text.primary` | `#292820` | ink (v1) |
| `color.text.secondary` | `#4d4740` | ink-3 |
| `color.text.muted` | `#736b61` | ink-4 (subtítulo "cinza") |
| `color.text.onBrand` | `#000000` | = brand.onBrand |
| `color.border.default` | `#e5ded4` | paper-rule / border |
| `color.border.focus` | `#32C6F4` | ring no foco (marca) |
| `color.feedback.errorBg` | `#fef2f2` | bg-red-50 |
| `color.feedback.errorText` | `#dc2626` | text-red-600 |
| `radius.sm` | `0.25rem` | base −4px |
| `radius.md` | `0.375rem` | base −2px |
| `radius.lg` | `0.5rem` | `--radius` base v1 |
| `space.xs` | `0.25rem` | escala 4px |
| `space.sm` | `0.5rem` | |
| `space.md` | `1rem` | padding form |
| `space.lg` | `1.5rem` | gaps card |
| `space.xl` | `2rem` | padding card (p-8) |
| `font.family.heading` | `'Inter Variable', ui-sans-serif, system-ui, …` | Inter |
| `font.family.body` | `'Nunito Variable', ui-sans-serif, system-ui, …` | Nunito |
| `font.family.mono` | `'JetBrains Mono', ui-monospace, …` | JetBrains Mono |
| `font.size.xs` | `0.75rem` | auxiliar |
| `font.size.sm` | `0.875rem` | label/input (text-sm) |
| `font.size.md` | `1rem` | corpo |
| `font.size.lg` | `1.25rem` | |
| `font.size.xl` | `1.5rem` | título (text-2xl) |
| `font.weight.regular` | `400` | |
| `font.weight.medium` | `500` | label |
| `font.weight.semibold` | `600` | |
| `font.weight.bold` | `700` | título (font-bold) |
| `shadow.card` | `0 4px 22px 0 rgba(0,0,0,0.05)` ou equivalente a `shadow-md` | sombra do card login |

> Valores marcados como derivados de neutros/erro serão fixados definitivamente na implementação (alguns são escolha de mapeamento; o critério é fidelidade perceptível à v1, SC-006).

## Validation rules (para os testes — SC-001/003/006)

- `color.brand.normal === '#32C6F4'` e `color.brand.hover === '#76D9F8'`.
- `radius.lg === '0.5rem'`.
- Nenhum valor `color.*` igual aos institucionais proibidos (`#396496`, `#2d4f75`, `#1f7d55`, `#176642`).
- `font.family.heading` começa por Inter; `body` por Nunito; ambos terminam em fallback de sistema.
- Todas as folhas do contrato têm valor correspondente (cobertura completa).

## State transitions

N/A — tokens são valores estáticos. (A única "transição" futura é troca de tema, coberta pelo contrato.)
