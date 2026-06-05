# Quickstart — Consumindo os Design Tokens

Como um componente futuro (átomo/molécula) usa os tokens. **Nunca** escreva hex/px/nome de fonte cru — sempre `vars`.

## Importar e usar (`.css.ts` de um componente)

```ts
// src/modules/<m>/client/ui/<algo>.css.ts  (ou shared/ui/atoms/...)
import { style } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens'   // contrato tipado (nomes, não valores)

export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '2.5rem',
  paddingInline: vars.space.md,
  borderRadius: vars.radius.lg,
  fontFamily: vars.font.family.body,
  fontWeight: vars.font.weight.medium,
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  selectors: {
    '&:hover': { background: vars.color.brand.hover },
    '&:disabled': {
      background: vars.color.brand.disabled,
      color: vars.color.brand.onDisabled,
    },
  },
})
```

```tsx
// componente burro consome a classe
import { button } from './button.css.ts'
export function Button(props: { label: string }) {
  return <button className={button}>{props.label}</button>
}
```

## O que acontece no build

- O vanilla-extract avalia os `.css.ts`, resolve `vars.*` para CSS custom properties e emite **CSS estático** (zero-runtime, SSR-safe).
- `vars.cor.inexistente` → **erro de compilação** (não passa no `typecheck`/build).

## Tokens disponíveis

Veja [data-model.md](./data-model.md) para a árvore completa (`color`, `radius`, `space`, `font`, `shadow`).

## Fontes (já carregadas globalmente)

`@fontsource*` é importado uma vez no boot (`src/app/router.tsx`). Você só referencia `vars.font.family.*` — o `@font-face` self-host já está registrado.

## Verificação rápida

```bash
pnpm typecheck   # tokens type-safe; uso inválido não compila
pnpm test        # node:test valida os valores (fidelidade v1)
pnpm build       # CSS de tokens emitido estaticamente
```
