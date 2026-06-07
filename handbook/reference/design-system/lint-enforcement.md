# Enforcement do Design System por lint

> **Status:** ✅ **APLICADO** (2026-05-30, spec 004). Configurado em `eslint.config.js`.
> As regras "mordem" assim que existirem componentes (`atoms/molecules/organisms`) e `.css.ts` de UI.
> Provado com arquivos-isca (hex cru + import cruzado) que reprovaram no lint e foram removidos.

Dois enforcements garantem que o design system não regrida:

1. **Só tokens** — proíbe cor/medida crua (hex, px, rgb/hsl) nos componentes; força `vars.*`.
2. **Hierarquia Atomic Design** — `atoms ↛ molecules ↛ organisms`: dependência só "para baixo".

Decisão (Tech Lead, 2026-05-30): **zero dependência nova** — regra nativa **`no-restricted-syntax`** (só-tokens) + reuso do **`eslint-plugin-boundaries`** (já no projeto) para a hierarquia. Alinha ao Princípio VIII (Minimal Dependencies). O plugin dedicado `@antebudimir/eslint-plugin-vanilla-extract` foi avaliado e **preterido** (evitar +dep sem provenance).

---

## Parte A — "Só tokens" (zero-dep, `no-restricted-syntax`)

Bloco no `eslint.config.js`, escopado à UI do design system + UI de feature. **Exclui** `tokens/` e `*.values.ts` (que legitimamente definem os literais).

```js
{
  files: ['src/shared/ui/{atoms,molecules,organisms}/**/*.{ts,tsx}', 'src/modules/*/client/ui/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': ['error',
      { selector: 'Literal[value=/#(?:[0-9a-fA-F]{3,4}){1,2}\\b/]', message: 'Cor crua proibida (design system). Use vars.color.* de #shared/ui/tokens.' },
      { selector: 'Literal[value=/^-?\\d*\\.?\\d+px$/]', message: 'Medida em px crua proibida. Use vars.space.*/vars.radius.*.' },
      { selector: 'Literal[value=/(?:rgb|rgba|hsl|hsla)\\(/i]', message: 'Cor crua (rgb/hsl) proibida. Use vars.color.*.' },
    ],
  },
}
```

**Cobre:** hex (`#fff`/`#32C6F4`/8-díg), `px` cru, `rgb()/rgba()/hsl()/hsla()` — em qualquer literal string (props JSX, inline, constantes), dentro do escopo.

**NÃO cobre (limitações honestas):**
- Token "errado mas válido" (`vars.color.text` onde devia ser `vars.color.brand`) — só pega valor cru.
- Cor por nome (`'red'`, `'white'`) — não banido (evita falso-positivo). Adicionar selector se virar problema.
- Template literal dinâmico (`` `${x}px` ``).
- ⚠️ Convive com `eslint-plugin-no-secrets` (entropia): manter strings/comentários simples para não disparar falso-positivo de "segredo".
- ⚠️ Flat config **substitui** `no-restricted-syntax` por escopo. Se um arquivo do DS também precisar dos selectors TS 6→7/XSS globais, re-incluí-los nesse bloco.

## Parte B — Hierarquia Atomic Design (`eslint-plugin-boundaries`, já no projeto)

`boundaries/elements` (ANTES do `shared-ui` genérico — ordem importa):
```js
{ type: 'ds-tokens',   pattern: 'src/shared/ui/tokens' },
{ type: 'ds-atom',     pattern: 'src/shared/ui/atoms' },
{ type: 'ds-molecule', pattern: 'src/shared/ui/molecules' },
{ type: 'ds-organism', pattern: 'src/shared/ui/organisms' },
{ type: 'shared-ui',   pattern: 'src/shared/ui' },
```

Regras direcionais (cada nível só importa de baixo + tokens + shared):
```js
{ from: { type: 'ds-tokens' },   allow: { to: { type: ['shared', 'ds-tokens'] } } },
{ from: { type: 'ds-atom' },     allow: { to: { type: ['shared', 'ds-tokens', 'ds-atom'] } } },
{ from: { type: 'ds-molecule' }, allow: { to: { type: ['shared', 'ds-tokens', 'ds-atom', 'ds-molecule'] } } },
{ from: { type: 'ds-organism' }, allow: { to: { type: ['shared', 'ds-tokens', 'ds-atom', 'ds-molecule', 'ds-organism'] } } },
{ from: { type: 'shared-ui' },   allow: { to: { type: ['shared', 'shared-ui', 'ds-tokens', 'ds-atom', 'ds-molecule', 'ds-organism'] } } },
```

**Garante:** atom não importa molecule/organism; molecule não importa organism; ninguém importa "para cima".
**NÃO cobre:** imports que não casam nenhum `pattern` (viram "unknown", ignorados — garantir patterns cobrindo todo `src/shared/ui/**`); composição indevida em runtime (lint é estático).

## Prova de que "morde" (feita em 2026-05-30)

Arquivos-isca temporários confirmaram os dois enforcements antes de remover:
- `atoms/_probe/bad-color.ts` com `'#ff0000'` → ❌ `no-restricted-syntax` "Cor crua proibida (design system)".
- `atoms/_probe/bad-import.ts` importando `molecules/` → ❌ `boundaries/element-types` "File is of type 'ds-atom'. Dependency is of type 'ds-molecule'".
- Após remover as iscas: `pnpm lint` verde (0 erros).

## Quando os componentes chegarem (próxima spec)

1. Criar `atoms/molecules/organisms/` e um componente-piloto (Button) usando só `vars.*`.
2. `pnpm lint` deve permanecer verde; reprovar de novo com um hex cru proposital.
3. Se aparecerem falsos-positivos (nome de cor legítimo, etc.), refinar selectors aqui e atualizar este guia.
