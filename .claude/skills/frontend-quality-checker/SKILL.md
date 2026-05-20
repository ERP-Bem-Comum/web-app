---
name: frontend-quality-checker
description: >
  Gate operacional do `erp-financeiro-frontend` antes de fechar PR. Roda
  `pnpm lint` (ESLint flat config), `pnpm format:check` (Prettier) e
  `pnpm build` (Next 16 + Turbopack) reportando saída integral. **Não roda
  `tsc --noEmit`** porque `next.config.js` tem `typescript.ignoreBuildErrors:
  true` — checagem TS pura é teatro até essa flag mudar. Use ao final de
  qualquer mudança em código antes de declarar pronto.
---

# frontend-quality-checker

Gate operacional do `erp-financeiro-frontend`. Acionada pelo [`frontend-orchestrator`](../../agents/frontend-orchestrator.md) ao final de qualquer mudança em código.

---

## Quando usar

- "Rodar lint + format + build pra ver se passa"
- "Quero confirmar que o PR está limpo antes de mandar"
- Antes de qualquer commit que toque em `src/`, `lib/`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `package.json`

**Não use** para:
- Bug fix de comentário ou doc (não toca em código compilável).
- Mudança em `handbook/` ou `.claude/`.

---

## Os 3 checks obrigatórios

### Check 1 — Lint

```bash
pnpm lint        # eslint .
```

**Config:** flat config em `eslint.config.mjs`:
- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`
- `eslint-config-prettier/flat` (desliga regras conflitantes com Prettier)
- Ignora `handbook/**` e `public/**`

**Critério:** zero erros. Warnings de peer dependencies (ESLint 10 vs plugins) **não vêm do lint**; vêm do `pnpm install` — ignorar.

### Check 2 — Format check

```bash
pnpm format:check    # prettier --check .
```

**Config:** Prettier 3 + `prettier-plugin-tailwindcss` (ordena classes Tailwind automaticamente).

**Critério:** zero arquivos com diff. Se falhar:

```bash
pnpm format          # prettier --write . (auto-fix)
```

### Check 3 — Build

```bash
pnpm build           # next build (Turbopack)
```

**Critério:** `✓ Compiled successfully` + geração de páginas estáticas sem erro.

> ⚠️ `next.config.js` tem `typescript.ignoreBuildErrors: true` — erros TS **não fazem build falhar**. Se houver erro de tipo crítico, ele aparece no editor mas não aqui. Não é responsabilidade desta skill resolver.

---

## Por que NÃO rodar `tsc --noEmit`

`next.config.js`:

```js
typescript: { ignoreBuildErrors: true }
```

Implicações:

- Build passa mesmo com erro de tipo.
- Rodar `tsc --noEmit` à parte mostra erros que o build aceita — sinaliza dívida, mas não bloqueia release.
- Aceitar `tsc` como gate criaria PRs presos por erros pré-existentes não-relacionados.

**Decisão:** ignorar TS no gate até a flag mudar. Quando ligar `strict: true` + `ignoreBuildErrors: false`, esta skill ganha Check 4.

---

## Template de saída

```markdown
# Quality Check — <data ISO>

| # | Check | Status | Detalhes |
| --- | --- | --- | --- |
| 1 | `pnpm lint` | ✅ / ❌ | (link para saída) |
| 2 | `pnpm format:check` | ✅ / ❌ | — |
| 3 | `pnpm build` | ✅ / ❌ | `Compiled successfully in X.Ys` / N erros |

**Veredito final:** ✅ ALL GREEN | ❌ BLOCKED

## Saída integral

### Check 1 — `pnpm lint`
```
(saída literal)
```

### Check 2 — `pnpm format:check`
```
(saída literal)
```

### Check 3 — `pnpm build`
```
(saída literal — só as últimas linhas relevantes)
```
```

---

## Comportamento sob falha

### Lint falhou

- Mostre as primeiras 10 violações com `file:line:col`.
- Sugira `pnpm lint --fix` se as regras forem auto-fixáveis.
- **Não auto-aplique fix** sem confirmação do usuário.

### Format falhou

- Sugira `pnpm format` para auto-fix.
- Geralmente é seguro auto-aplicar (Prettier só re-formata).

### Build falhou

- Capture o erro principal (geralmente "Module not found" ou erro de runtime no SSR).
- Sugira o expert pertinente:
  - "Module not found" → [`pnpm-workspace-expert`](../../agents/pnpm-workspace-expert.md) ou [`react-query-fetch-expert`](../../agents/react-query-fetch-expert.md) (libs removidas na poda).
  - Erro de hidration / RSC → [`nextjs-app-router-expert`](../../agents/nextjs-app-router-expert.md).
  - Erro de CSS / Tailwind → [`tailwind-shadcn-mui-expert`](../../agents/tailwind-shadcn-mui-expert.md).

---

## Anti-padrões

1. **Reportar "tudo OK" sem incluir output literal.** Sempre traga as 3 saídas.
2. **Modificar código para "consertar" erros sem aprovação.** Esta skill é gate, não fixer.
3. **Pular Check 2** porque "é só Prettier". Format é parte do gate.
4. **Tentar rodar `pnpm test`** — não existe no projeto.
5. **Adicionar `tsc --noEmit` como Check 4** sem antes mudar `ignoreBuildErrors: false`.
6. **Veredito ambíguo** (`ALMOST GREEN`). Binário: `ALL GREEN` ou `BLOCKED`.

---

## Como rodar (one-liner)

```bash
pnpm lint && pnpm format:check && pnpm build
```

Falha em qualquer um para a cadeia (`&&`). Se quiser ver todos os outputs mesmo com falha:

```bash
pnpm lint; pnpm format:check; pnpm build
```

---

## Changelog

- **2026-05-20:** Criação. Adaptado do `ts-quality-checker` do core-api. Sem `tsc` e sem `node --test` (não cabe no frontend).
