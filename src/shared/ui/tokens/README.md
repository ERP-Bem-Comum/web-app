# Design Tokens (`shared/ui/tokens`)

Fonte única de verdade visual da v2. **Nunca** escreva cor/medida/fonte crua (hex, px, nome de fonte) num componente — **sempre** referencie `vars.*`.

> Spec: [`specs/004-design-tokens`](../../../../specs/004-design-tokens/) · Árvore canônica de valores: [`data-model.md`](../../../../specs/004-design-tokens/data-model.md) · Decisões: ADR-0007 (vanilla-extract), ADR-0008 (self-host @fontsource).

## Como consumir

```ts
import { style } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens'

export const button = style({
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  borderRadius: vars.radius.lg,
  paddingInline: vars.space.md,
  fontFamily: vars.font.family.body,
  selectors: { '&:hover': { background: vars.color.brand.hover } },
})
```

Referenciar um token inexistente (`vars.color.cyan`) é **erro de compilação** (`pnpm typecheck`).

## Arquivos

| Arquivo | Papel |
| :-- | :-- |
| `tokens.values.ts` | **Valores** crus (`as const`, puro). Fonte da verdade; testado por `node:test`. |
| `contract.css.ts` | **Contrato** (`createThemeContract`) — só nomes/estrutura. Exporta `vars`. |
| `theme.css.ts` | Aplica os valores ao contrato no `:root` (`createGlobalTheme`) → CSS estático. |
| `fonts.ts` | Registra os `@font-face` self-host (@fontsource). `.ts` (não `.css.ts`) de propósito. |
| `index.ts` | API pública: `export { vars }`. **Não** reexporta os valores crus. |
| `fontsource.d.ts` | Ambient types dos imports side-effect das fontes. |

`theme.css.ts` + `fonts.ts` são importados **uma vez** no boot (`src/app/router.tsx`).

## Paleta (uma só — marca ciano, fiel à v1)

| Papel | Token | Valor |
| :-- | :-- | :-- |
| Marca | `color.brand.normal` / `.hover` | `#32C6F4` / `#76D9F8` |
| Texto sobre marca | `color.brand.onBrand` | `#000000` |
| Superfície | `color.surface.default` | `#ffffff` |
| Texto | `color.text.{primary,secondary,muted}` | escala de neutros |
| Borda | `color.border.{default,focus}` | — |
| Feedback | `color.feedback.{errorBg,errorText}` | — |
| Raio | `radius.{sm,md,lg}` | base `lg = 0.5rem` |
| Espaço | `space.{xs..xl}` | escala 4px |
| Fonte | `font.family.{heading,body,mono}` | Inter / Nunito / JetBrains Mono |
| Sombra | `shadow.card` | elevação do card |

⚠️ **Não** herdar a paleta "institucional" da v1 (azul `#396496` / verde `#1f7d55`). O teste `tokens.values.test.ts` trava isso.

## Tema futuro (dark)

O contrato (`vars`) é separado dos valores. Para um tema novo, basta um segundo `createGlobalTheme('[data-theme="dark"]', vars, <valoresDark>)` — **sem** tocar nos componentes que consomem `vars`.

## Enforcement por lint — pendente (próxima spec: componentes)

O guard-rail de "só tokens" e a hierarquia Atomic Design **serão configurados quando os componentes existirem**. Passo-a-passo documentado em [`handbook/reference/design-system/lint-enforcement.md`](../../../../handbook/reference/design-system/lint-enforcement.md).
